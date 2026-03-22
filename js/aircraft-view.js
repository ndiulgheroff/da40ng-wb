import { LOADING_STATIONS } from './fleet-data.js';
import { t } from './i18n.js';

/**
 * DA40NG top-down schematic with Piper Cherokee silhouette as base shape,
 * rotated 90° (nose left). Loading zones overlay the silhouette.
 */

// Zone positions mapped onto the rotated silhouette (viewBox 0 0 520 180)
const ZONES = [
  { id: 'frontSeats', x: 190, y: 58, w: 58, h: 44, label: () => t('frontSeats') },
  { id: 'rearSeats',  x: 262, y: 62, w: 48, h: 36, label: () => t('rearSeats') },
  { id: 'stdBaggage', x: 322, y: 68, w: 42, h: 28, label: () => t('stdBaggage') },
  { id: 'baggageTube', x: 374, y: 72, w: 38, h: 20, label: () => t('baggageTube') },
  { id: 'fuel',       x: 130, y: 14, w: 84, h: 22, label: () => t('fuel') },
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
<svg viewBox="0 0 520 180" xmlns="http://www.w3.org/2000/svg" class="aircraft-svg">
  <defs>
    <linearGradient id="bodyGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="rgba(255,255,255,0.08)"/>
      <stop offset="50%" stop-color="rgba(255,255,255,0.04)"/>
      <stop offset="100%" stop-color="rgba(255,255,255,0.02)"/>
    </linearGradient>
  </defs>

  <!-- === AIRCRAFT SILHOUETTE (nose left, top-down) === -->

  <!-- Fuselage - main body -->
  <path d="M 45,90
           C 30,88 18,86 10,84 C 5,82 2,80 0,78
           L 0,102
           C 2,100 5,98 10,96 C 18,94 30,92 45,90 Z"
        fill="url(#bodyGrad)" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
  <path d="M 45,72
           L 90,66 C 110,63 130,61 155,60
           L 250,58 L 340,57
           C 370,57 395,59 415,63
           C 430,66 440,71 445,78
           L 445,102
           C 440,109 430,114 415,117
           C 395,121 370,123 340,123
           L 250,122 L 155,120
           C 130,119 110,117 90,114
           L 45,108 Z"
        fill="url(#bodyGrad)" stroke="rgba(255,255,255,0.2)" stroke-width="1.2"/>

  <!-- Nose cone - smooth taper -->
  <path d="M 45,72 C 35,74 25,78 18,82 C 12,85 7,87 3,89
           L 0,90
           L 3,91 C 7,93 12,95 18,98 C 25,102 35,106 45,108"
        fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>

  <!-- Propeller disc -->
  <ellipse cx="2" cy="90" rx="1.5" ry="5"
           fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.15)" stroke-width="0.6"/>
  <line x1="0" y1="68" x2="0" y2="112"
        stroke="rgba(255,255,255,0.15)" stroke-width="1.5" stroke-linecap="round"/>

  <!-- Left wing (top in view) -->
  <path d="M 125,66 L 100,22 C 98,18 97,14 97,12
           C 97,9 99,7 102,6
           L 225,4
           C 228,4 230,6 230,8
           C 230,10 229,14 227,18
           L 210,56"
        fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>

  <!-- Right wing (bottom in view) -->
  <path d="M 125,114 L 100,158 C 98,162 97,166 97,168
           C 97,171 99,173 102,174
           L 225,176
           C 228,176 230,174 230,172
           C 230,170 229,166 227,162
           L 210,124"
        fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>

  <!-- Wing fuel tank outlines (dashed) -->
  <rect x="115" y="14" width="95" height="16" rx="3"
        fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="0.5" stroke-dasharray="4,3"/>
  <rect x="115" y="150" width="95" height="16" rx="3"
        fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="0.5" stroke-dasharray="4,3"/>

  <!-- Horizontal stabilizer -->
  <path d="M 430,72 L 455,48 C 457,46 460,44 463,44
           L 490,42 C 493,42 495,44 494,46 L 478,68"
        fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.15)" stroke-width="0.8"/>
  <path d="M 430,108 L 455,132 C 457,134 460,136 463,136
           L 490,138 C 493,138 495,136 494,134 L 478,112"
        fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.15)" stroke-width="0.8"/>

  <!-- Vertical stabilizer -->
  <rect x="435" y="83" width="25" height="14" rx="2"
        fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.12)" stroke-width="0.6"/>

  <!-- Canopy / windshield outline -->
  <path d="M 160,70 C 165,66 175,64 185,63
           L 215,63 C 225,64 235,66 240,70"
        fill="none" stroke="rgba(120,180,255,0.15)" stroke-width="0.8"/>
  <path d="M 160,110 C 165,114 175,116 185,117
           L 215,117 C 225,116 235,114 240,110"
        fill="none" stroke="rgba(120,180,255,0.15)" stroke-width="0.8"/>

  <!-- Landing gear dots -->
  <circle cx="170" cy="56" r="2.5" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.12)" stroke-width="0.5"/>
  <circle cx="170" cy="124" r="2.5" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.12)" stroke-width="0.5"/>
  <circle cx="55" cy="90" r="2" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/>

  <!-- === LOADING ZONES === -->
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
  <text x="260" y="174" text-anchor="middle" fill="rgba(255,255,255,0.15)" font-size="7.5" letter-spacing="4">
    ← FWD                                              AFT →
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
