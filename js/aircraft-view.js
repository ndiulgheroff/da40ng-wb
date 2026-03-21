import { LOADING_STATIONS, FUEL_ARM } from './fleet-data.js';
import { t } from './i18n.js';

/**
 * DA40NG top-down schematic view with weight distribution indicators.
 * Each loading zone is clickable and shows current weight + color coding.
 */

// Zone positions (relative to SVG viewBox 0 0 400 160)
const ZONES = [
  { id: 'frontSeats', x: 140, y: 45, w: 60, h: 40, label: () => t('frontSeats') },
  { id: 'rearSeats',  x: 210, y: 45, w: 50, h: 40, label: () => t('rearSeats') },
  { id: 'stdBaggage', x: 268, y: 50, w: 40, h: 30, label: () => t('stdBaggage') },
  { id: 'baggageTube', x: 315, y: 55, w: 35, h: 20, label: () => t('baggageTube') },
  { id: 'fuel',       x: 105, y: 10, w: 70, h: 24, label: () => t('fuel') },
];

function getZoneColor(ratio) {
  if (ratio === 0) return 'rgba(255,255,255,0.06)';
  if (ratio <= 0.7) return 'rgba(76,175,80,0.25)';
  if (ratio <= 0.9) return 'rgba(255,193,7,0.3)';
  if (ratio <= 1.0) return 'rgba(255,152,0,0.35)';
  return 'rgba(244,67,54,0.4)';
}

function getZoneBorder(ratio) {
  if (ratio === 0) return 'rgba(255,255,255,0.15)';
  if (ratio <= 0.7) return '#4CAF50';
  if (ratio <= 0.9) return '#FFC107';
  if (ratio <= 1.0) return '#FF9800';
  return '#f44336';
}

export function renderAircraftView(container, stationMasses, fuelLiters, maxFuelLiters) {
  const stationMap = {};
  for (const s of LOADING_STATIONS) {
    stationMap[s.id] = s;
  }

  // Build zone data
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
<svg viewBox="0 0 400 130" xmlns="http://www.w3.org/2000/svg" class="aircraft-svg">
  <!-- Fuselage -->
  <path d="M 60,65 Q 30,65 15,60 Q 5,55 2,50 Q 5,45 15,40 Q 30,35 60,35
           L 310,30 Q 340,28 360,32 Q 375,38 380,50
           Q 375,62 360,68 Q 340,72 310,70 L 60,65 Z"
        fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.25)" stroke-width="1.5"/>

  <!-- Wings -->
  <path d="M 120,50 L 80,8 Q 78,4 82,3 L 180,3 Q 184,4 182,8 L 170,40"
        fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
  <path d="M 120,50 L 80,92 Q 78,96 82,97 L 180,97 Q 184,96 182,92 L 170,60"
        fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>

  <!-- Tail -->
  <path d="M 350,50 L 370,18 Q 372,14 376,15 L 395,22 Q 398,24 396,28 L 380,42"
        fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
  <path d="M 350,50 L 370,82 Q 372,86 376,85 L 395,78 Q 398,76 396,72 L 380,58"
        fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>

  <!-- Propeller -->
  <line x1="2" y1="35" x2="2" y2="65" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>

  <!-- Engine -->
  <rect x="8" y="42" width="30" height="16" rx="3"
        fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.15)" stroke-width="0.8"/>

  <!-- Loading zones -->
  ${zoneData.map(z => `
    <rect x="${z.x}" y="${z.y}" width="${z.w}" height="${z.h}" rx="4"
          fill="${getZoneColor(z.ratio)}" stroke="${getZoneBorder(z.ratio)}" stroke-width="1.5"
          class="zone-rect" data-zone="${z.id}" style="cursor:pointer"/>
    <text x="${z.x + z.w/2}" y="${z.y + z.h/2 - 2}" text-anchor="middle"
          fill="${getZoneBorder(z.ratio)}" font-size="8" font-weight="bold" pointer-events="none">
      ${z.id === 'fuel' ? z.mass + ' L' : (z.mass > 0 ? z.mass + ' kg' : '')}
    </text>
    <text x="${z.x + z.w/2}" y="${z.y + z.h/2 + 9}" text-anchor="middle"
          fill="rgba(255,255,255,0.4)" font-size="6" pointer-events="none">
      ${z.id === 'fuel' ? '/ ' + z.maxMass + ' L' : (z.maxMass > 0 ? '/ ' + z.maxMass + ' kg' : '')}
    </text>
  `).join('')}

  <!-- CG indicator line -->
  <text x="200" y="125" text-anchor="middle" fill="rgba(255,255,255,0.3)" font-size="8">
    ← FWD          AFT →
  </text>
</svg>`;

  container.innerHTML = svg;

  // Click handler — focus the corresponding input
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
