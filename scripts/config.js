/**
 * Configurações globais da aplicação
 * @module config
 */

// ⚠️ LOCAL DEVELOPMENT: Set your API key here
// PRODUCTION: Uses GitHub Secrets (injected by GitHub Actions workflow)
export const OMDB_API_KEY = 'YOUR_API_KEY_HERE';
export const OMDB_BASE_URL = 'https://www.omdbapi.com/';

/**
 * Filmes populares para a landing page
 * A API OMDb não possui endpoint de trending, então usamos termos predefinidos
 */
export const POPULAR_MOVIES_TERMS = [
  'Avengers',
  'Batman',
  'Star Wars',
  'Harry Potter',
  'Inception',
  'Interstellar',
  'The Matrix',
  'Pulp Fiction',
  'The Godfather',
  'Forrest Gump'
];

/**
 * Configurações de performance
 */
export const DEBOUNCE_DELAY = 300;
export const SEARCH_TIMEOUT = 8000;
export const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 horas em ms

/**
 * Constantes de UI
 */
export const ITEMS_PER_PAGE = 10;
export const SKELETON_CARDS_COUNT = 6;
export const MODAL_FOCUS_SELECTOR = '[role="dialog"] h2';
