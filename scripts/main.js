/**
 * Bootstrap e orquestração da aplicação
 * @module main
 */

import { OMDB_API_KEY, POPULAR_MOVIES_TERMS, SKELETON_CARDS_COUNT } from './config.js';
import { searchMovies, getMovieDetails } from './api.js';
import {
  renderMovieGrid,
  renderLoadingState,
  renderErrorState,
  renderMovieDetails,
  updateResultsCount,
  renderPagination,
  updateMetaTags
} from './ui.js';
import { AccessibleModal, createModalElement } from './modal.js';
import { debounce, getErrorMessage, isValidAPIKey } from './utils.js';

// Estado da aplicação
const appState = {
  currentSearchTerm: '',
  currentPage: 1,
  totalResults: 0,
  currentMovies: [],
  movieDetailsCache: new Map(),
  abortController: null
};

// Elementos do DOM
let elements = {};

/**
 * Inicializa aplicação
 */
async function init() {
  // Valida API key
  if (!isValidAPIKey(OMDB_API_KEY)) {
    showAPIKeyWarning();
    return;
  }

  // Cache de elementos do DOM
  cacheElements();

  // Cria modal
  const modal = createModalElement();
  document.body.appendChild(modal);
  elements.modal = new AccessibleModal(modal);

  // Configura event listeners
  setupEventListeners();

  // Carrega filmes populares na inicialização
  await loadPopularMovies();
}

/**
 * Cache de elementos do DOM
 */
function cacheElements() {
  elements = {
    searchInput: document.getElementById('search-input'),
    searchBtn: document.getElementById('search-btn'),
    searchForm: document.getElementById('search-form'),
    resultsContainer: document.getElementById('results-container'),
    resultsCount: document.getElementById('results-count'),
    paginationContainer: document.getElementById('pagination-container'),
    headerTitle: document.querySelector('h1'),
    mainContent: document.getElementById('main-content'),
    loadingIndicator: document.getElementById('loading-indicator')
  };
}

/**
 * Configura event listeners
 */
function setupEventListeners() {
  // Busca de filmes
  elements.searchForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    performSearch();
  });

  // Debounce para busca ao digitar
  const debouncedSearch = debounce(() => {
    if (elements.searchInput.value.trim()) {
      performSearch();
    }
  }, 300);

  elements.searchInput?.addEventListener('input', debouncedSearch);

  // Delegação para botões "Detalhes"
  elements.resultsContainer?.addEventListener('click', async (e) => {
    if (e.target.classList.contains('card__button')) {
      const imdbId = e.target.dataset.imdbid;
      await openMovieDetails(imdbId, e.target);
    }
  });

  // Fechar modal
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal__close') || e.target.classList.contains('button--secondary')) {
      const dialogElement = e.target.closest('[role="dialog"]');
      if (dialogElement && elements.modal) {
        elements.modal.close();
      }
    }
  });
}

/**
 * Carrega filmes populares na landing
 */
async function loadPopularMovies() {
  renderLoadingState(elements.resultsContainer, SKELETON_CARDS_COUNT);
  elements.resultsCount.textContent = 'Carregando filmes populares...';

  try {
    const allMovies = [];
    const promises = POPULAR_MOVIES_TERMS.slice(0, 2).map(term =>
      searchMovies(term, 1)
        .then(result => {
          if (result.Search) {
            allMovies.push(...result.Search.slice(0, 3));
          }
        })
        .catch(err => console.warn(`Erro ao carregar "${term}":`, err))
    );

    await Promise.all(promises);

    if (allMovies.length > 0) {
      appState.currentMovies = allMovies;
      renderMovieGrid(allMovies, elements.resultsContainer);
      elements.resultsCount.textContent = `${allMovies.length} filmes populares`;
    } else {
      renderErrorState(elements.resultsContainer, 'Não foi possível carregar filmes populares.');
    }
  } catch (error) {
    renderErrorState(elements.resultsContainer, getErrorMessage(error));
  }
}

/**
 * Realiza busca de filmes
 */
async function performSearch() {
  const searchTerm = elements.searchInput?.value.trim();

  if (!searchTerm) {
    elements.resultsCount.textContent = 'Digite um termo para buscar.';
    return;
  }

  // Cancela requisição anterior se houver
  if (appState.abortController) {
    appState.abortController.abort();
  }

  appState.abortController = new AbortController();
  appState.currentSearchTerm = searchTerm;
  appState.currentPage = 1;

  renderLoadingState(elements.resultsContainer, SKELETON_CARDS_COUNT);
  elements.resultsCount.setAttribute('aria-live', 'polite');
  elements.resultsCount.textContent = 'Carregando resultados...';

  try {
    const result = await searchMovies(searchTerm, appState.currentPage, appState.abortController.signal);

    if (!result.Search || result.Search.length === 0) {
      renderErrorState(elements.resultsContainer, `Nenhum resultado para "${searchTerm}"`);
      elements.resultsCount.textContent = '0 resultados encontrados';
      return;
    }

    appState.currentMovies = result.Search;
    appState.totalResults = parseInt(result.totalResults) || 0;

    renderMovieGrid(appState.currentMovies, elements.resultsContainer);
    updateResultsCount(elements.resultsCount, appState.currentMovies.length, searchTerm);

    // Renderiza paginação
    const hasNextPage = (appState.currentPage * 10) < appState.totalResults;
    renderPagination(appState.currentPage, hasNextPage, elements.paginationContainer, handlePageChange);
  } catch (error) {
    if (error.name !== 'AbortError') {
      renderErrorState(elements.resultsContainer, getErrorMessage(error));
      elements.resultsCount.textContent = 'Erro na busca';
    }
  } finally {
    appState.abortController = null;
  }
}

/**
 * Manipula mudança de página
 * @param {number} page - Número da página
 */
async function handlePageChange(page) {
  appState.currentPage = page;
  window.scrollTo({ top: elements.mainContent?.offsetTop || 0, behavior: 'smooth' });
  await performSearch();
}

/**
 * Abre detalhes do filme em modal
 * @param {string} imdbId - ID IMDb
 * @param {HTMLElement} triggerElement - Elemento que ativou o modal
 */
async function openMovieDetails(imdbId, triggerElement) {
  try {
    // Verifica cache
    if (appState.movieDetailsCache.has(imdbId)) {
      const movie = appState.movieDetailsCache.get(imdbId);
      const html = renderMovieDetails(movie);
      elements.modal.setContent(html);
      updateMetaTags(movie);
      elements.modal.open(triggerElement);
      return;
    }

    // Renderiza estado de carregamento
    elements.modal.setContent(`
      <div class="loading-modal" role="status">
        <p aria-live="polite">Carregando detalhes do filme...</p>
      </div>
    `);
    elements.modal.open(triggerElement);

    // Busca detalhes
    const movie = await getMovieDetails(imdbId);
    appState.movieDetailsCache.set(imdbId, movie);

    // Renderiza conteúdo
    const html = renderMovieDetails(movie);
    elements.modal.setContent(html);
    updateMetaTags(movie);

    // Re-attach listeners para botões do modal
    const closeBtn = elements.modal.modal.querySelector('.modal__close');
    const secondaryBtn = elements.modal.modal.querySelector('.button--secondary');
    closeBtn?.addEventListener('click', () => elements.modal.close());
    secondaryBtn?.addEventListener('click', () => elements.modal.close());
  } catch (error) {
    elements.modal.setContent(`
      <div class="error-modal" role="alert">
        <h2>Erro ao carregar detalhes</h2>
        <p>${getErrorMessage(error)}</p>
        <button class="button button--secondary" onclick="this.closest('[role=\\'dialog\\']').parentElement.parentElement.click()">
          Fechar
        </button>
      </div>
    `);
  }
}

/**
 * Exibe aviso de API key não configurada
 */
function showAPIKeyWarning() {
  const container = document.getElementById('results-container');
  if (!container) return;

  container.innerHTML = `
    <div class="error-state" role="alert" style="grid-column: 1 / -1;">
      <h2>⚙️ Configuração Necessária</h2>
      <p><strong>API key do OMDb não configurada!</strong></p>
      <ol style="text-align: left; margin: 1rem 0;">
        <li>Abra <code>scripts/config.js</code></li>
        <li>Substitua <code>YOUR_API_KEY_HERE</code> pela sua chave do OMDb</li>
        <li>Obtenha uma chave gratuita em <a href="https://www.omdbapi.com/" target="_blank" rel="noopener">omdbapi.com</a></li>
        <li>Recarregue a página</li>
      </ol>
      <p style="font-size: 0.9rem; color: #666;">Consulte o README.md para mais detalhes.</p>
    </div>
  `;
}

// Inicia aplicação quando DOM está pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Permite acesso a funções para debug/tests
window.appDebug = {
  state: appState,
  clearCache: () => {
    localStorage.clear();
    appState.movieDetailsCache.clear();
    console.log('Cache limpo');
  }
};
