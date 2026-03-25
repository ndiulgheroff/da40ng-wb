import { t } from './i18n.js';

/**
 * Aircraft top-down view with loading zones overlaid on silhouette.
 * All types use the same aircraft.svg background with type-specific zone positions.
 */

// Zone layouts per aircraft type (viewBox 0 0 600 200)
// 'fuel:systemId' zones map to fuel system inputs
const ZONE_LAYOUTS = {
  DA40NG: [
    { id: 'frontSeats',  x: 210, y: 74, w: 60, h: 44 },
    { id: 'rearSeats',   x: 276, y: 80, w: 48, h: 36 },
    { id: 'stdBaggage',  x: 336, y: 84, w: 42, h: 28 },
    { id: 'baggageTube', x: 384, y: 88, w: 54, h: 20 },
    { id: 'fuel:mainFuel', x: 234, y: 12, w: 54, h: 42 },
  ],
  DA42NG: [
    { id: 'noseBaggage',   x: 130, y: 82, w: 50, h: 28 },
    { id: 'frontSeats',    x: 200, y: 70, w: 60, h: 48 },
    { id: 'rearSeats',     x: 268, y: 76, w: 52, h: 40 },
    { id: 'cabinBaggage',  x: 328, y: 82, w: 44, h: 28 },
    { id: 'baggageExt',    x: 378, y: 86, w: 48, h: 22 },
    { id: 'deIcingFluid',  x: 155, y: 18, w: 50, h: 30 },
    { id: 'fuel:mainFuel', x: 224, y: 10, w: 54, h: 38 },
    { id: 'fuel:auxFuel',  x: 290, y: 14, w: 50, h: 34 },
  ],
  IAL42: [
    { id: 'noseBaggage',   x: 130, y: 82, w: 50, h: 28 },
    { id: 'frontSeats',    x: 200, y: 70, w: 60, h: 48 },
    { id: 'rearSeats',     x: 268, y: 76, w: 52, h: 40 },
    { id: 'cabinBaggage',  x: 328, y: 82, w: 44, h: 28 },
    { id: 'baggageExt',    x: 378, y: 86, w: 48, h: 22 },
    { id: 'deIcingFluid',  x: 155, y: 18, w: 50, h: 30 },
    { id: 'fuel:mainFuel', x: 224, y: 10, w: 54, h: 38 },
    { id: 'fuel:auxFuel',  x: 290, y: 14, w: 50, h: 34 },
  ],
  DA20C1: [
    { id: 'pilotAndPax',   x: 200, y: 68, w: 70, h: 54 },
    { id: 'baggage',       x: 280, y: 78, w: 50, h: 36 },
    { id: 'baggageExt',    x: 338, y: 84, w: 50, h: 28 },
    { id: 'fuel:mainFuel', x: 234, y: 12, w: 54, h: 40 },
  ],
};

function getZoneColor(ratio) {
  if (ratio === 0) return 'rgba(0, 150, 255, 0.15)';
  if (ratio <= 0.7) return 'rgba(0, 150, 255, 0.3)';
  if (ratio <= 0.9) return 'rgba(255, 193, 7, 0.35)';
  if (ratio <= 1.0) return 'rgba(255, 120, 0, 0.4)';
  return 'rgba(244, 67, 54, 0.45)';
}

function getZoneBorder(ratio) {
  if (ratio === 0) return '#2196F3';
  if (ratio <= 0.7) return '#42A5F5';
  if (ratio <= 0.9) return '#FFC107';
  if (ratio <= 1.0) return '#FF9800';
  return '#f44336';
}

function getTextColor(ratio) {
  if (ratio === 0) return '#64B5F6';
  if (ratio <= 0.7) return '#90CAF9';
  if (ratio <= 0.9) return '#FFD54F';
  if (ratio <= 1.0) return '#FFB74D';
  return '#EF9A9A';
}

/**
 * @param {HTMLElement} container
 * @param {object|null} typeConfig — the selected type from AIRCRAFT_TYPES
 * @param {object} stationMasses — { stationId: kg }
 * @param {object} fuelLiters — { fuelSystemId: liters }
 * @param {object} fuelMaxLiters — { fuelSystemId: maxLiters }
 * @param {string|null} registration — selected aircraft registration (for onlyFor filtering)
 */
export function renderAircraftView(container, typeConfig, stationMasses, fuelLiters, fuelMaxLiters, registration) {
  if (!typeConfig) {
    container.innerHTML = '';
    return;
  }

  const stationMap = {};
  for (const s of typeConfig.loadingStations) stationMap[s.id] = s;

  const fuelMap = {};
  for (const fs of typeConfig.fuelSystems) fuelMap[fs.id] = fs;

  // Filter zones: hide station zones that have onlyFor and don't match the selected aircraft
  const allZones = ZONE_LAYOUTS[typeConfig.id] || [];
  const zones = allZones.filter(z => {
    if (z.id.startsWith('fuel:')) return true;
    const station = stationMap[z.id];
    if (!station || !station.onlyFor) return true;
    return registration && station.onlyFor.includes(registration);
  });

  const zoneData = zones.map(z => {
    let mass, maxMass, ratio, unit, displayId;

    let label;
    if (z.id.startsWith('fuel:')) {
      // Fuel zone
      const fsId = z.id.slice(5);
      const fs = fuelMap[fsId];
      mass = fuelLiters[fsId] || 0;
      maxMass = fuelMaxLiters[fsId] || (fs ? fs.maxLiters : 0);
      ratio = maxMass > 0 ? mass / maxMass : 0;
      unit = 'L';
      displayId = fsId;
      const lang = document.documentElement.lang === 'en' ? 'en' : 'it';
      label = fs ? (lang === 'en' ? fs.labelEn : fs.labelIt) : 'Fuel';
    } else {
      // Station zone
      const station = stationMap[z.id];
      mass = stationMasses[z.id] || 0;
      maxMass = station ? station.maxKg : 0;
      ratio = maxMass > 0 ? mass / maxMass : 0;
      unit = 'kg';
      displayId = z.id;
      const lang = document.documentElement.lang === 'en' ? 'en' : 'it';
      label = station ? (lang === 'en' ? station.labelEn : station.labelIt) : z.id;
    }
    return { ...z, mass, maxMass, ratio, unit, displayId, label };
  });

  const svg = `
<svg viewBox="0 0 600 200" xmlns="http://www.w3.org/2000/svg" class="aircraft-svg">
  ${zoneData.map(z => {
    const massText = z.unit === 'L' ? `${z.mass} L` : (z.mass > 0 ? `${z.mass} kg` : '—');
    const maxText = `max ${z.maxMass} ${z.unit}`;
    return `
    <text x="${z.x + z.w/2}" y="${z.y - 4}" text-anchor="middle"
          fill="rgba(255,255,255,0.6)" font-size="7" font-weight="bold" pointer-events="none">
      ${z.label}
    </text>
    <rect x="${z.x}" y="${z.y}" width="${z.w}" height="${z.h}" rx="4"
          fill="#12121f" stroke="none" pointer-events="none"/>
    <rect x="${z.x}" y="${z.y}" width="${z.w}" height="${z.h}" rx="4"
          fill="${getZoneColor(z.ratio)}" stroke="${getZoneBorder(z.ratio)}" stroke-width="2"
          class="zone-rect" data-zone="${z.displayId}" data-isfuel="${z.id.startsWith('fuel:') ? '1' : '0'}" style="cursor:pointer"/>
    <text x="${z.x + z.w/2}" y="${z.y + z.h/2}" text-anchor="middle" dominant-baseline="central"
          fill="${getTextColor(z.ratio)}" font-size="9" font-weight="bold" pointer-events="none">
      ${massText}
    </text>
    <text x="${z.x + z.w/2}" y="${z.y + z.h + 11}" text-anchor="middle"
          fill="rgba(255,255,255,0.5)" font-size="7" pointer-events="none">
      ${maxText}
    </text>`;
  }).join('')}
</svg>`;

  container.innerHTML = `<img src="img/aircraft.svg" class="aircraft-bg" alt=""/>` + svg;

  // Click zones to focus corresponding input
  container.querySelectorAll('.zone-rect').forEach(rect => {
    rect.addEventListener('click', () => {
      const zoneId = rect.getAttribute('data-zone');
      const isFuel = rect.getAttribute('data-isfuel') === '1';
      if (isFuel) {
        const input = document.querySelector(`.fuel-input[data-fuel="${zoneId}"]`);
        if (input) { input.focus(); input.select(); }
      } else {
        const input = document.querySelector(`[data-station="${zoneId}"]`);
        if (input) { input.focus(); input.select(); }
      }
    });
  });
}
