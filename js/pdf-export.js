/**
 * PDF Export — handles print-specific setup.
 * Renders both CG and Moment diagrams at high resolution for print.
 */

import { renderEnvelope, renderMomentRange } from './cg-envelope.js';

let currentOptions = null;

export function setPrintOptions(options) {
  currentOptions = options;
}

export function initPdfExport(cgCanvas, momentCanvas) {
  window.addEventListener('beforeprint', () => {
    if (currentOptions) {
      const origDpr = window.devicePixelRatio;
      Object.defineProperty(window, 'devicePixelRatio', { value: 2, writable: true, configurable: true });
      renderEnvelope(cgCanvas, currentOptions, currentOptions.chartScales, true);
      renderMomentRange(momentCanvas, currentOptions, currentOptions.chartScales, true);
      Object.defineProperty(window, 'devicePixelRatio', { value: origDpr, writable: true, configurable: true });
    }
  });

  window.addEventListener('afterprint', () => {
    if (currentOptions) {
      renderEnvelope(cgCanvas, currentOptions, currentOptions.chartScales);
      renderMomentRange(momentCanvas, currentOptions, currentOptions.chartScales);
    }
  });
}
