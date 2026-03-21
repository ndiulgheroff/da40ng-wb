import { LOADING_STATIONS } from './fleet-data.js';
import { t } from './i18n.js';

/**
 * DA40NG top-down schematic view with weight distribution indicators.
 * Aircraft silhouette based on PA-28/SR-22 SVG shapes (GPL v3 / AircraftShapesSVG),
 * adapted for DA40NG configuration: low-wing, single-engine, T-tail.
 */

// Zone layout positions (SVG viewBox 0 0 500 180)
const ZONES = [
  { id: 'frontSeats', x: 168, y: 68, w: 55, h: 44, label: () => t('frontSeats') },
  { id: 'rearSeats',  x: 240, y: 72, w: 45, h: 36, label: () => t('rearSeats') },
  { id: 'stdBaggage', x: 298, y: 76, w: 40, h: 28, label: () => t('stdBaggage') },
  { id: 'baggageTube', x: 348, y: 80, w: 35, h: 20, label: () => t('baggageTube') },
  { id: 'fuel',       x: 115, y: 16, w: 80, h: 22, label: () => t('fuel') },
];

function getZoneColor(ratio) {
  if (ratio === 0) return 'rgba(255,255,255,0.04)';
  if (ratio <= 0.7) return 'rgba(76,175,80,0.2)';
  if (ratio <= 0.9) return 'rgba(255,193,7,0.25)';
  if (ratio <= 1.0) return 'rgba(255,152,0,0.3)';
  return 'rgba(244,67,54,0.35)';
}

function getZoneBorder(ratio) {
  if (ratio === 0) return 'rgba(255,255,255,0.12)';
  if (ratio <= 0.7) return '#4CAF50';
  if (ratio <= 0.9) return '#FFC107';
  if (ratio <= 1.0) return '#FF9800';
  return '#f44336';
}

function getTextColor(ratio) {
  if (ratio === 0) return 'rgba(255,255,255,0.2)';
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

  const acFill = 'rgba(255,255,255,0.03)';
  const acStroke = 'rgba(255,255,255,0.18)';
  const acStrokeW = '1.2';

  const svg = `
<svg viewBox="0 0 500 180" xmlns="http://www.w3.org/2000/svg" class="aircraft-svg">
  <!-- Fuselage - sleek low-wing body -->
  <path d="M 50,90
           C 35,90 20,87 12,84 C 6,81 3,78 2,75
           L 0,75 L 0,105 L 2,105
           C 3,102 6,99 12,96 C 20,93 35,90 50,90 Z"
        fill="${acFill}" stroke="${acStroke}" stroke-width="${acStrokeW}"/>
  <path d="M 50,75 C 50,75 55,65 70,62 L 155,58 L 300,55
           C 340,54 370,56 395,62 C 410,66 418,72 420,78
           L 420,102
           C 418,108 410,114 395,118 C 370,124 340,126 300,125
           L 155,122 L 70,118 C 55,115 50,105 50,105 Z"
        fill="${acFill}" stroke="${acStroke}" stroke-width="${acStrokeW}"/>

  <!-- Nose cone -->
  <path d="M 50,75 C 42,77 35,80 30,83 C 25,86 20,88 15,89
           L 3,90
           L 15,91 C 20,92 25,94 30,97 C 35,100 42,103 50,105"
        fill="${acFill}" stroke="${acStroke}" stroke-width="${acStrokeW}"/>

  <!-- Spinner/Propeller -->
  <ellipse cx="3" cy="90" rx="2" ry="4" fill="rgba(255,255,255,0.08)" stroke="${acStroke}" stroke-width="0.8"/>
  <line x1="1" y1="70" x2="1" y2="110" stroke="rgba(255,255,255,0.2)" stroke-width="1.5" stroke-linecap="round"/>

  <!-- Wings - low mounted, swept trailing edge -->
  <path d="M 130,72 L 105,30 C 103,26 100,22 100,18 L 100,14
           C 100,12 102,10 105,10 L 210,8 C 213,8 215,10 215,12
           L 215,15 C 215,18 212,24 210,28 L 195,62"
        fill="${acFill}" stroke="${acStroke}" stroke-width="${acStrokeW}"/>
  <path d="M 130,108 L 105,150 C 103,154 100,158 100,162 L 100,166
           C 100,168 102,170 105,170 L 210,172 C 213,172 215,170 215,168
           L 215,165 C 215,162 212,156 210,152 L 195,118"
        fill="${acFill}" stroke="${acStroke}" stroke-width="${acStrokeW}"/>

  <!-- Wing fuel tank indicators (inside wings) -->
  <rect x="120" y="20" width="70" height="14" rx="3"
        fill="rgba(76,175,80,0.06)" stroke="rgba(255,255,255,0.08)" stroke-width="0.5" stroke-dasharray="3,2"/>
  <rect x="120" y="146" width="70" height="14" rx="3"
        fill="rgba(76,175,80,0.06)" stroke="rgba(255,255,255,0.08)" stroke-width="0.5" stroke-dasharray="3,2"/>

  <!-- Horizontal Stabilizer (T-tail - mounted high) -->
  <path d="M 405,78 L 430,52 C 432,50 435,48 438,48 L 470,46
           C 473,46 475,48 474,50 L 460,72 L 435,78"
        fill="${acFill}" stroke="${acStroke}" stroke-width="${acStrokeW}"/>
  <path d="M 405,102 L 430,128 C 432,130 435,132 438,132 L 470,134
           C 473,134 475,132 474,130 L 460,108 L 435,102"
        fill="${acFill}" stroke="${acStroke}" stroke-width="${acStrokeW}"/>

  <!-- Vertical Stabilizer (center line, T-tail) -->
  <rect x="410" y="84" width="28" height="12" rx="2"
        fill="rgba(255,255,255,0.05)" stroke="${acStroke}" stroke-width="0.8"/>

  <!-- Windshield -->
  <path d="M 145,68 C 150,64 160,62 170,62 L 185,62
           C 195,62 205,64 210,68 L 210,72
           C 205,70 195,68 185,68 L 170,68
           C 160,68 150,70 145,72 Z"
        fill="rgba(100,180,255,0.08)" stroke="rgba(100,180,255,0.2)" stroke-width="0.8"/>
  <path d="M 145,112 C 150,116 160,118 170,118 L 185,118
           C 195,118 205,116 210,112 L 210,108
           C 205,110 195,112 185,112 L 170,112
           C 160,112 150,110 145,108 Z"
        fill="rgba(100,180,255,0.08)" stroke="rgba(100,180,255,0.2)" stroke-width="0.8"/>

  <!-- Main landing gear -->
  <rect x="155" y="55" width="4" height="8" rx="1" fill="rgba(255,255,255,0.1)"/>
  <rect x="155" y="117" width="4" height="8" rx="1" fill="rgba(255,255,255,0.1)"/>

  <!-- Nose gear -->
  <rect x="60" y="87" width="3" height="6" rx="1" fill="rgba(255,255,255,0.1)"/>

  <!-- Loading zones with labels -->
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
          fill="rgba(255,255,255,0.25)" font-size="6.5" pointer-events="none">
      ${maxText}
    </text>`;
  }).join('')}

  <!-- Axis reference -->
  <text x="250" y="175" text-anchor="middle" fill="rgba(255,255,255,0.2)" font-size="8" letter-spacing="3">
    ← FWD                                        AFT →
  </text>
</svg>`;

  container.innerHTML = svg;

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
