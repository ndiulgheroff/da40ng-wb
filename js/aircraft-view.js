import { LOADING_STATIONS } from './fleet-data.js';
import { t } from './i18n.js';

/**
 * DA40NG top-down view using Piper Cherokee SVG silhouette as background,
 * rotated 90° (nose left). Loading zones overlay the silhouette.
 */

// Zone positions mapped onto the rotated aircraft image
// The SVG is 674x859 originally (nose up), rotated 90° becomes ~859x674 (nose left)
// Container aspect ratio ~3:1, zones positioned relative to viewBox "0 0 600 200"
const ZONES = [
  { id: 'frontSeats', x: 200, y: 68, w: 60, h: 44, label: () => t('frontSeats') },
  { id: 'rearSeats',  x: 275, y: 72, w: 50, h: 36, label: () => t('rearSeats') },
  { id: 'stdBaggage', x: 338, y: 76, w: 44, h: 28, label: () => t('stdBaggage') },
  { id: 'baggageTube', x: 394, y: 80, w: 40, h: 20, label: () => t('baggageTube') },
  { id: 'fuel',       x: 140, y: 20, w: 95, h: 22, label: () => t('fuel') },
];

function getZoneColor(ratio) {
  if (ratio === 0) return 'rgba(255,255,255,0.04)';
  if (ratio <= 0.7) return 'rgba(76,175,80,0.25)';
  if (ratio <= 0.9) return 'rgba(255,193,7,0.3)';
  if (ratio <= 1.0) return 'rgba(255,152,0,0.35)';
  return 'rgba(244,67,54,0.4)';
}

function getZoneBorder(ratio) {
  if (ratio === 0) return 'rgba(255,255,255,0.12)';
  if (ratio <= 0.7) return '#4CAF50';
  if (ratio <= 0.9) return '#FFC107';
  if (ratio <= 1.0) return '#FF9800';
  return '#f44336';
}

function getTextColor(ratio) {
  if (ratio === 0) return 'rgba(255,255,255,0.25)';
  return getZoneBorder(ratio);
}

export function renderAircraftView(container, stationMasses, fuelLiters, maxFuelLiters) {
  const stationMap = {};
  for (const s of LOADING_STATIONS) stationMap[s.id] = s;

  const zoneData = ZONES.map(z => {
    let mass, maxMass, ratio;
    if (z.id === 'fuel') {
      mass = fuelLiters;
      maxMass = maxFuelLiters;
      ratio = maxMass > 0 ? mass / maxMass : 0;
    } else {
      const station = stationMap[z.id];
      mass = stationMasses[z.id] || 0;
      maxMass = station ? station.maxKg : 0;
      ratio = maxMass > 0 ? mass / maxMass : 0;
    }
    return { ...z, mass, maxMass, ratio };
  });

  const svg = `
<svg viewBox="0 0 600 200" xmlns="http://www.w3.org/2000/svg" class="aircraft-svg">
  <!-- Aircraft silhouette as background image, CSS handles rotation -->

  <!-- Loading zones -->
  ${zoneData.map(z => {
    const massText = z.id === 'fuel' ? `${z.mass} L` : (z.mass > 0 ? `${z.mass} kg` : '—');
    const maxText = z.id === 'fuel' ? `max ${z.maxMass} L` : `max ${z.maxMass} kg`;
    return `
    <rect x="${z.x}" y="${z.y}" width="${z.w}" height="${z.h}" rx="4"
          fill="${getZoneColor(z.ratio)}" stroke="${getZoneBorder(z.ratio)}" stroke-width="1.5"
          class="zone-rect" data-zone="${z.id}" style="cursor:pointer"/>
    <text x="${z.x + z.w/2}" y="${z.y + z.h/2}" text-anchor="middle" dominant-baseline="central"
          fill="${getTextColor(z.ratio)}" font-size="9" font-weight="bold" pointer-events="none">
      ${massText}
    </text>
    <text x="${z.x + z.w/2}" y="${z.y + z.h + 10}" text-anchor="middle"
          fill="rgba(255,255,255,0.2)" font-size="6" pointer-events="none">
      ${maxText}
    </text>`;
  }).join('')}

  <!-- Direction reference -->
  <text x="300" y="195" text-anchor="middle" fill="rgba(255,255,255,0.15)" font-size="7.5" letter-spacing="4">
    ← FWD                                              AFT →
  </text>
</svg>`;

  container.innerHTML = `<img src="img/aircraft.svg" class="aircraft-bg" alt=""/>` + svg;

  // Click zones to focus corresponding input
  container.querySelectorAll('.zone-rect').forEach(rect => {
    rect.addEventListener('click', () => {
      const zoneId = rect.getAttribute('data-zone');
      if (zoneId === 'fuel') {
        const input = document.getElementById('fuelInput');
        if (input) { input.focus(); input.select(); }
      } else {
        const input = document.querySelector(`[data-station="${zoneId}"]`);
        if (input) { input.focus(); input.select(); }
      }
    });
  });
}
