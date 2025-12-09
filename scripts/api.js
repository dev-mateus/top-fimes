/**
 * Módulo de comunicação com API OMDb
 * @module api
 */

import { OMDB_API_KEY, OMDB_BASE_URL, SEARCH_TIMEOUT } from './config.js';
import { getErrorMessage, isValidAPIKey } from './utils.js';

// Cache em memória para respostas
const memoryCache = new Map();

/**
 * Obtém dados do cache (memória ou localStorage)
 * @param {string} key - Chave do cache
 * @returns {any} Dados em cache ou null
 */
function getFromCache(key) {
  // Verifica cache em memória primeiro
  if (memoryCache.has(key)) {
    return memoryCache.get(key);
  }

  // Verifica localStorage
  try {
    const cached = localStorage.getItem(`omdb_${key}`);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      const isExpired = Date.now() - timestamp > 24 * 60 * 60 * 1000; // 24 horas
      if (!isExpired) {
        memoryCache.set(key, data);
        return data;
      }
      localStorage.removeItem(`omdb_${key}`);
    }
  } catch (e) {
    console.warn('Erro ao acessar localStorage:', e);
  }

  return null;
}

/**
 * Armazena dados em cache
 * @param {string} key - Chave do cache
 * @param {any} data - Dados a armazenar
 */
function setCache(key, data) {
  memoryCache.set(key, data);
  try {
    localStorage.setItem(`omdb_${key}`, JSON.stringify({ data, timestamp: Date.now() }));
  } catch (e) {
    console.warn('LocalStorage cheio ou indisponível:', e);
  }
}

/**
 * Valida resposta da API
 * @param {any} data - Resposta da API
 * @param {string} type - Tipo de busca ('search' ou 'detail')
 * @throws {Error} Se resposta indicar erro
 */
function validateAPIResponse(data, type = 'search') {
  if (data.Response === 'False') {
    throw new Error(data.Error || 'Erro na API OMDb');
  }

  if (type === 'search' && !data.Search) {
    throw new Error('Nenhum resultado encontrado.');
  }

  if (type === 'detail' && !data.imdbID) {
    throw new Error('Filme não encontrado.');
  }

  return true;
}

/**
 * Busca filmes por termo
 * @param {string} searchTerm - Termo de busca
 * @param {number} page - Página de resultados (default: 1)
 * @param {AbortSignal} signal - Signal para cancelar requisição
 * @returns {Promise<Object>} Objeto com Search e totalResults
 * @throws {Error} Se falhar na busca
 */
export async function searchMovies(searchTerm, page = 1, signal = null) {
  if (!isValidAPIKey(OMDB_API_KEY)) {
    throw new Error(
      'API key não configurada. Configure em scripts/config.js'
    );
  }

  if (!searchTerm || searchTerm.trim().length === 0) {
    throw new Error('Por favor, insira um termo de busca.');
  }

  const cacheKey = `search_${searchTerm.toLowerCase()}_${page}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  const controller = signal ? null : new AbortController();
  const searchSignal = signal || controller?.signal;

  try {
    const url = new URL(OMDB_BASE_URL);
    url.searchParams.set('apikey', OMDB_API_KEY);
    url.searchParams.set('s', searchTerm.trim());
    url.searchParams.set('type', 'movie');
    url.searchParams.set('page', page);

    const timeoutId = setTimeout(() => {
      if (controller) controller.abort();
    }, SEARCH_TIMEOUT);

    const response = await fetch(url.toString(), {
      signal: searchSignal,
      cache: 'force-cache'
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    validateAPIResponse(data, 'search');

    setCache(cacheKey, data);
    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Busca cancelada.');
    }
    throw error;
  }
}

/**
 * Obtém detalhes de um filme
 * @param {string} imdbID - ID IMDb do filme
 * @param {AbortSignal} signal - Signal para cancelar requisição
 * @returns {Promise<Object>} Objeto com detalhes do filme
 * @throws {Error} Se falhar na busca
 */
export async function getMovieDetails(imdbID, signal = null) {
  if (!isValidAPIKey(OMDB_API_KEY)) {
    throw new Error(
      'API key não configurada. Configure em scripts/config.js'
    );
  }

  if (!imdbID || imdbID.trim().length === 0) {
    throw new Error('ID IMDb inválido.');
  }

  const cacheKey = `detail_${imdbID}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  const controller = signal ? null : new AbortController();
  const detailSignal = signal || controller?.signal;

  try {
    const url = new URL(OMDB_BASE_URL);
    url.searchParams.set('apikey', OMDB_API_KEY);
    url.searchParams.set('i', imdbID);
    url.searchParams.set('plot', 'full');

    const timeoutId = setTimeout(() => {
      if (controller) controller.abort();
    }, SEARCH_TIMEOUT);

    const response = await fetch(url.toString(), {
      signal: detailSignal,
      cache: 'force-cache'
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    validateAPIResponse(data, 'detail');

    setCache(cacheKey, data);
    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Requisição cancelada.');
    }
    throw error;
  }
}

/**
 * Limpa cache (útil para testes e debug)
 */
export function clearCache() {
  memoryCache.clear();
  try {
    const keys = Object.keys(localStorage).filter(k => k.startsWith('omdb_'));
    keys.forEach(key => localStorage.removeItem(key));
  } catch (e) {
    console.warn('Erro ao limpar localStorage:', e);
  }
}

/**
 * Obtém status do cache
 * @returns {Object} Informações do cache
 */
export function getCacheStats() {
  return {
    memoryCacheSize: memoryCache.size,
    localStorageItems: Object.keys(localStorage).filter(k => k.startsWith('omdb_')).length
  };
}
