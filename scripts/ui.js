/**
 * Módulo de renderização de UI
 * @module ui
 */

import { formatYear, formatRating, truncateText, generateYouTubeTrailerURL, createSkeletonCards } from './utils.js';
import { getMovieDetails } from './api.js';

/**
 * Cria card de filme
 * @param {Object} movie - Objeto do filme
 * @returns {HTMLElement} Elemento article com card
 */
export function createMovieCard(movie) {
  const article = document.createElement('article');
  article.className = 'card';
  article.setAttribute('role', 'region');
  article.setAttribute('aria-label', `Filme: ${movie.Title}`);

  const posterUrl = movie.Poster && movie.Poster !== 'N/A'
    ? movie.Poster
    : '/assets/placeholder.svg';

  const year = formatYear(movie.Year);

  article.innerHTML = `
    <div class="card__image">
      <img 
        src="${posterUrl}" 
        alt="Pôster do filme ${movie.Title}"
        loading="lazy"
        decoding="async"
        width="300"
        height="450"
      />
    </div>
    <div class="card__content">
      <h3 class="card__title">${escapeHtml(movie.Title)}</h3>
      <p class="card__year">${year}</p>
      ${movie.imdbRating && movie.imdbRating !== 'N/A'
        ? `<p class="card__rating"><strong>IMDb:</strong> ${formatRating(movie.imdbRating)}/10</p>`
        : ''
      }
      <button 
        class="card__button" 
        data-imdbid="${movie.imdbID}"
        aria-label="Ver detalhes de ${movie.Title}"
      >
        Detalhes
      </button>
    </div>
  `;

  return article;
}

/**
 * Renderiza grade de filmes
 * @param {Object[]} movies - Array de filmes
 * @param {HTMLElement} container - Container para renderizar
 * @param {boolean} append - Se deve adicionar ou substituir conteúdo
 */
export function renderMovieGrid(movies, container, append = false) {
  if (!append) {
    container.innerHTML = '';
  }

  if (!movies || movies.length === 0) {
    container.innerHTML = `
      <div class="empty-state" role="status">
        <p>Nenhum filme encontrado. Tente outra busca.</p>
      </div>
    `;
    return;
  }

  movies.forEach((movie) => {
    if (movie.imdbID) {
      const card = createMovieCard(movie);
      container.appendChild(card);
    }
  });
}

/**
 * Renderiza estado de carregamento (skeleton)
 * @param {HTMLElement} container - Container para renderizar
 * @param {number} count - Quantidade de skeletons
 */
export function renderLoadingState(container, count = 6) {
  container.innerHTML = '';
  const skeletons = createSkeletonCards(count);
  skeletons.forEach((skeleton) => container.appendChild(skeleton));
}

/**
 * Renderiza estado de erro
 * @param {HTMLElement} container - Container para renderizar
 * @param {string} errorMessage - Mensagem de erro
 */
export function renderErrorState(container, errorMessage) {
  container.innerHTML = `
    <div class="error-state" role="alert">
      <p><strong>Erro:</strong> ${escapeHtml(errorMessage)}</p>
      <p class="error-state__hint">Verifique sua conexão e tente novamente.</p>
    </div>
  `;
}

/**
 * Renderiza detalhes do filme em modal
 * @param {Object} movie - Objeto com detalhes do filme
 * @returns {string} HTML do conteúdo do modal
 */
export function renderMovieDetails(movie) {
  const posterUrl = movie.Poster && movie.Poster !== 'N/A'
    ? movie.Poster
    : '/assets/placeholder.svg';

  const year = formatYear(movie.Year);
  const rating = formatRating(movie.imdbRating);
  const trailerUrl = generateYouTubeTrailerURL(movie.Title, movie.Year);

  // Estrutura JSON-LD para SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Movie',
    name: movie.Title,
    image: movie.Poster && movie.Poster !== 'N/A' ? movie.Poster : undefined,
    datePublished: movie.Year,
    description: movie.Plot,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: movie.imdbRating,
      ratingCount: '250000',
      bestRating: '10',
      worstRating: '1'
    },
    actor: movie.Actors
      ? movie.Actors.split(', ').slice(0, 3).map(name => ({
        '@type': 'Person',
        name: name.trim()
      }))
      : [],
    genre: movie.Genre ? movie.Genre.split(', ') : []
  };

  // Remove campos undefined do JSON-LD
  Object.keys(jsonLd).forEach(key => jsonLd[key] === undefined && delete jsonLd[key]);

  return `
    <script type="application/ld+json">
      ${JSON.stringify(jsonLd)}
    </script>
    <button class="modal__close" aria-label="Fechar detalhes do filme">
      <span aria-hidden="true">&times;</span>
    </button>
    <div class="modal__header">
      <h2 id="modal-title">${escapeHtml(movie.Title)}</h2>
      <p class="modal__year">${year}</p>
    </div>
    <div class="modal__body">
      <img 
        src="${posterUrl}"
        alt="Pôster do filme ${movie.Title}"
        class="modal__poster"
        loading="lazy"
        decoding="async"
        width="200"
        height="300"
      />
      <div class="modal__info">
        ${movie.Plot && movie.Plot !== 'N/A'
          ? `<div class="modal__section">
               <h3>Sinopse</h3>
               <p>${escapeHtml(movie.Plot)}</p>
             </div>`
          : ''
        }
        ${movie.Genre && movie.Genre !== 'N/A'
          ? `<div class="modal__section">
               <h3>Gênero</h3>
               <p>${escapeHtml(movie.Genre)}</p>
             </div>`
          : ''
        }
        ${movie.Actors && movie.Actors !== 'N/A'
          ? `<div class="modal__section">
               <h3>Elenco Principal</h3>
               <p>${escapeHtml(movie.Actors)}</p>
             </div>`
          : ''
        }
        ${movie.Director && movie.Director !== 'N/A'
          ? `<div class="modal__section">
               <h3>Diretor</h3>
               <p>${escapeHtml(movie.Director)}</p>
             </div>`
          : ''
        }
        <div class="modal__section">
          <h3>Avaliação IMDb</h3>
          <p><strong>${rating}/10</strong></p>
        </div>
      </div>
    </div>
    <div class="modal__footer">
      <a 
        href="${trailerUrl}"
        target="_blank"
        rel="noopener noreferrer"
        class="button button--primary"
        aria-label="Ver trailer de ${movie.Title} no YouTube"
      >
        🎬 Ver Trailer
      </a>
      <button class="button button--secondary" aria-label="Fechar modal">
        Fechar
      </button>
    </div>
  `;
}

/**
 * Atualiza contagem de resultados
 * @param {HTMLElement} element - Elemento para atualizar
 * @param {number} count - Número de resultados
 * @param {string} searchTerm - Termo de busca
 */
export function updateResultsCount(element, count, searchTerm) {
  if (!element) return;
  element.setAttribute('role', 'status');
  element.setAttribute('aria-live', 'polite');
  element.setAttribute('aria-atomic', 'true');
  element.textContent = `${count} resultado(s) encontrado(s) para "${escapeHtml(searchTerm)}"`;
}

/**
 * Cria elementos de paginação
 * @param {number} currentPage - Página atual
 * @param {boolean} hasNextPage - Se há próxima página
 * @param {HTMLElement} container - Container para paginação
 * @param {Function} onNextPage - Callback para próxima página
 */
export function renderPagination(currentPage, hasNextPage, container, onNextPage) {
  container.innerHTML = '';

  if (currentPage > 1) {
    const prevBtn = document.createElement('button');
    prevBtn.className = 'pagination__button';
    prevBtn.textContent = '← Anterior';
    prevBtn.addEventListener('click', () => onNextPage(currentPage - 1));
    container.appendChild(prevBtn);
  }

  const pageInfo = document.createElement('span');
  pageInfo.className = 'pagination__info';
  pageInfo.textContent = `Página ${currentPage}`;
  container.appendChild(pageInfo);

  if (hasNextPage) {
    const nextBtn = document.createElement('button');
    nextBtn.className = 'pagination__button';
    nextBtn.textContent = 'Próximo →';
    nextBtn.addEventListener('click', () => onNextPage(currentPage + 1));
    container.appendChild(nextBtn);
  }
}

/**
 * Escapa caracteres HTML para evitar XSS
 * @param {string} text - Texto a escapar
 * @returns {string} Texto escapado
 */
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Define meta tags dinâmicas para SEO
 * @param {Object} movie - Objeto do filme
 */
export function updateMetaTags(movie) {
  // Open Graph
  const ogImage = movie.Poster && movie.Poster !== 'N/A' ? movie.Poster : '/assets/placeholder.png';
  const ogDescription = movie.Plot && movie.Plot !== 'N/A'
    ? movie.Plot.substring(0, 160)
    : `Assistir ${movie.Title} - ${movie.Year}`;

  updateOrCreateMetaTag('og:title', movie.Title);
  updateOrCreateMetaTag('og:description', ogDescription);
  updateOrCreateMetaTag('og:image', ogImage);
  updateOrCreateMetaTag('og:type', 'video.movie');

  // Twitter Cards
  updateOrCreateMetaTag('twitter:title', movie.Title);
  updateOrCreateMetaTag('twitter:description', ogDescription);
  updateOrCreateMetaTag('twitter:image', ogImage);
  updateOrCreateMetaTag('twitter:card', 'summary_large_image');
}

function updateOrCreateMetaTag(property, content) {
  let meta = document.querySelector(`meta[property="${property}"], meta[name="${property}"]`);
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute(property.startsWith('og:') || property.startsWith('twitter:') ? 'property' : 'name', property);
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', content);
}
