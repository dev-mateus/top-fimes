/**
 * Utilitários gerais da aplicação
 * @module utils
 */

import { DEBOUNCE_DELAY } from './config.js';

/**
 * Função debounce para limitar chamadas frequentes
 * @param {Function} func - Função a ser executada
 * @param {number} delay - Tempo de espera em ms
 * @returns {Function} Função debounceada
 */
export function debounce(func, delay = DEBOUNCE_DELAY) {
  let timeoutId;
  return function debounced(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Formata data para padrão legível
 * @param {string} dateString - Ano ou data
 * @returns {string} Data formatada
 */
export function formatYear(dateString) {
  if (!dateString || dateString === 'N/A') return 'Ano desconhecido';
  return String(dateString).match(/\d{4}/) ? String(dateString).match(/\d{4}/)[0] : dateString;
}

/**
 * Obtém nota IMDb formatada
 * @param {string|number} rating - Nota IMDb
 * @returns {string} Nota formatada ou mensagem padrão
 */
export function formatRating(rating) {
  if (!rating || rating === 'N/A') return 'N/A';
  return parseFloat(rating).toFixed(1);
}

/**
 * Trunca texto para número de caracteres
 * @param {string} text - Texto a truncar
 * @param {number} maxLength - Comprimento máximo
 * @returns {string} Texto truncado com elipsis
 */
export function truncateText(text, maxLength = 100) {
  if (!text) return '';
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
}

/**
 * Sanitiza string removendo caracteres perigosos (basic XSS prevention)
 * @param {string} str - String a sanitizar
 * @returns {string} String sanitizada
 */
export function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Cria URL do YouTube para trailer
 * @param {string} title - Título do filme
 * @param {string} year - Ano do filme
 * @returns {string} URL do YouTube Search
 */
export function generateYouTubeTrailerURL(title, year) {
  const query = encodeURIComponent(`${title} ${year} trailer`);
  return `https://www.youtube.com/results?search_query=${query}`;
}

/**
 * Tratamento de erro com mensagem amigável
 * @param {Error|string} error - Erro capturado
 * @returns {string} Mensagem de erro formatada
 */
export function getErrorMessage(error) {
  if (typeof error === 'string') return error;
  
  if (error.name === 'AbortError') {
    return 'Busca cancelada pelo usuário.';
  }
  
  if (error.message?.includes('Failed to fetch')) {
    return 'Erro de conexão. Verifique sua internet e tente novamente.';
  }
  
  return error.message || 'Erro desconhecido. Tente novamente.';
}

/**
 * Valida e retorna chave de API
 * @param {string} apiKey - Chave da API
 * @returns {boolean} True se válida
 */
export function isValidAPIKey(apiKey) {
  return apiKey && apiKey.length > 5 && apiKey !== 'YOUR_API_KEY_HERE';
}

/**
 * Gera ID único para elementos
 * @param {string} prefix - Prefixo do ID
 * @returns {string} ID único
 */
export function generateUniqueId(prefix = 'id') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Verifica se URL é válida
 * @param {string} url - URL a validar
 * @returns {boolean} True se válida
 */
export function isValidURL(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Gerenciamento de foco para acessibilidade
 * @param {HTMLElement} element - Elemento a focar
 */
export function manageFocus(element) {
  if (element) {
    element.focus();
    // Se elemento é header, focar input se disponível
    if (!element.matches('input, button, a, [tabindex]')) {
      element.setAttribute('tabindex', '-1');
    }
  }
}

/**
 * Simula carregamento com skeleton screens (visual feedback)
 * @param {number} count - Quantidade de skeletons
 * @returns {HTMLElement[]} Array de elementos skeleton
 */
export function createSkeletonCards(count) {
  const skeletons = [];
  for (let i = 0; i < count; i++) {
    const skeleton = document.createElement('article');
    skeleton.className = 'card card--skeleton';
    skeleton.setAttribute('aria-hidden', 'true');
    skeleton.innerHTML = `
      <div class="card__image card__image--skeleton"></div>
      <div class="card__content">
        <div class="skeleton skeleton--title"></div>
        <div class="skeleton skeleton--text"></div>
        <div class="skeleton skeleton--button"></div>
      </div>
    `;
    skeletons.push(skeleton);
  }
  return skeletons;
}
