/**
 * PDF Export — handles print-specific setup.
 * The heavy lifting is done by CSS @media print in style.css.
 * This module just ensures the canvas is rendered at high resolution
 * before printing and restores it after.
 */

import { renderEnvelope } from './cg-envelope.js';

let currentOptions = null;

export function setPrintOptions(options) {
  currentOptions = options;
}

export function initPdfExport(canvasEl) {
  window.addEventListener('beforeprint', () => {
    if (currentOptions) {
      // Force 2x render for print quality
      const origDpr = window.devicePixelRatio;
      Object.defineProperty(window, 'devicePixelRatio', { value: 2, writable: true, configurable: true });
      renderEnvelope(canvasEl, currentOptions);
      Object.defineProperty(window, 'devicePixelRatio', { value: origDpr, writable: true, configurable: true });
    }
  });

  window.addEventListener('afterprint', () => {
    if (currentOptions) {
      renderEnvelope(canvasEl, currentOptions);
    }
  });
}
