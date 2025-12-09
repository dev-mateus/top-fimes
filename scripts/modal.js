/**
 * Gerenciamento de modal com acessibilidade (WCAG 2.1 AA)
 * @module modal
 */

import { manageFocus } from './utils.js';

/**
 * Classe para gerenciar modal com foco e acessibilidade
 */
export class AccessibleModal {
  constructor(modalElement) {
    this.modal = modalElement;
    this.previouslyFocusedElement = null;
    this.focusableElements = null;
    this.firstFocusableElement = null;
    this.lastFocusableElement = null;
    this.keyboardTrapListener = this.handleKeyboardTrap.bind(this);
    this.escapeListener = this.handleEscape.bind(this);
  }

  /**
   * Abre o modal
   * @param {HTMLElement} triggerElement - Elemento que ativou o modal
   */
  open(triggerElement = null) {
    this.previouslyFocusedElement = triggerElement || document.activeElement;
    this.modal.setAttribute('aria-hidden', 'false');
    this.modal.classList.add('modal--open');

    // Obtém elementos focáveis
    this.updateFocusableElements();

    // Configurar listeners
    this.modal.addEventListener('keydown', this.keyboardTrapListener);
    document.addEventListener('keydown', this.escapeListener);

    // Fechar ao clicar no backdrop
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.close();
      }
    });

    // Focar no primeiro elemento focável (título do modal)
    if (this.firstFocusableElement) {
      manageFocus(this.firstFocusableElement);
    }

    // Previne scroll do body
    document.body.style.overflow = 'hidden';
  }

  /**
   * Fecha o modal
   */
  close() {
    this.modal.setAttribute('aria-hidden', 'true');
    this.modal.classList.remove('modal--open');

    // Remove listeners
    this.modal.removeEventListener('keydown', this.keyboardTrapListener);
    document.removeEventListener('keydown', this.escapeListener);

    // Restaura scroll do body
    document.body.style.overflow = '';

    // Retorna foco ao elemento anterior
    if (this.previouslyFocusedElement) {
      manageFocus(this.previouslyFocusedElement);
    }
  }

  /**
   * Atualiza lista de elementos focáveis dentro do modal
   */
  updateFocusableElements() {
    const selector =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    this.focusableElements = Array.from(this.modal.querySelectorAll(selector));
    this.firstFocusableElement = this.focusableElements[0];
    this.lastFocusableElement = this.focusableElements[this.focusableElements.length - 1];
  }

  /**
   * Gerencia keyboard trap (Tab/Shift+Tab circula dentro do modal)
   * @param {KeyboardEvent} e - Evento do teclado
   */
  handleKeyboardTrap(e) {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === this.firstFocusableElement) {
        e.preventDefault();
        this.lastFocusableElement?.focus();
      }
    } else {
      // Tab
      if (document.activeElement === this.lastFocusableElement) {
        e.preventDefault();
        this.firstFocusableElement?.focus();
      }
    }
  }

  /**
   * Fecha modal ao pressionar Escape
   * @param {KeyboardEvent} e - Evento do teclado
   */
  handleEscape(e) {
    if (e.key === 'Escape' && this.modal.classList.contains('modal--open')) {
      this.close();
    }
  }

  /**
   * Verifica se modal está aberto
   * @returns {boolean}
   */
  isOpen() {
    return this.modal.classList.contains('modal--open');
  }

  /**
   * Define conteúdo do modal
   * @param {string} html - HTML a inserir (sanitizado externamente)
   */
  setContent(html) {
    const content = this.modal.querySelector('[role="dialog"]');
    if (content) {
      content.innerHTML = html;
      this.updateFocusableElements();
    }
  }

  /**
   * Anuncia mensagem via aria-live para screen readers
   * @param {string} message - Mensagem a anunciar
   * @param {string} type - Tipo de anúncio ('polite' ou 'assertive')
   */
  announce(message, type = 'polite') {
    const announcer = this.modal.querySelector('[aria-live]') || this.createAnnouncer(type);
    announcer.textContent = message;
  }

  /**
   * Cria elemento announcer para aria-live
   * @param {string} type - Tipo de aria-live
   * @returns {HTMLElement} Elemento announcer
   */
  createAnnouncer(type = 'polite') {
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', type);
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    this.modal.appendChild(announcer);
    return announcer;
  }
}

/**
 * Cria elemento modal HTML
 * @returns {HTMLElement} Elemento modal
 */
export function createModalElement() {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.setAttribute('aria-hidden', 'true');
  modal.innerHTML = `
    <div class="modal__overlay" role="presentation"></div>
    <div class="modal__container">
      <div role="dialog" aria-modal="true" aria-labelledby="modal-title" class="modal__content">
        <!-- Conteúdo será inserido dinamicamente -->
      </div>
    </div>
  `;
  return modal;
}

/**
 * Fecha todos os modais abertos
 * @param {AccessibleModal[]} modals - Array de instâncias do modal
 */
export function closeAllModals(modals) {
  modals.forEach((m) => {
    if (m.isOpen()) {
      m.close();
    }
  });
}
