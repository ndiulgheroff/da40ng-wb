import { t } from './i18n.js';

/**
 * Aircraft top-down view with loading zones.
 * Shows DA40NG silhouette for DA40NG type, generic zones for others.
 */

// DA40NG zone layout (original)
const DA40NG_ZONES = [
  { id: 'frontSeats', x: 210, y: 74, w: 60, h: 44 },
  { id: 'rearSeats',  x: 276, y: 80, w: 48, h: 36 },
  { id: 'stdBaggage', x: 336, y: 84, w: 42, h: 28 },
  { id: 'baggageTube', x: 384, y: 88, w: 54, h: 20 },
  { id: 'fuel',       x: 234, y: 12, w: 54, h: 42 },
];

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
 */
export function renderAircraftView(container, typeConfig, stationMasses, fuelLiters, fuelMaxLiters) {
  if (!typeConfig) {
    container.innerHTML = '';
    return;
  }

  // For DA40NG use the positioned silhouette view
  if (typeConfig.id === 'DA40NG') {
    renderDA40NGView(container, typeConfig, stationMasses, fuelLiters, fuelMaxLiters);
    return;
  }

  // For other types, render a simple horizontal bar view
  renderGenericView(container, typeConfig, stationMasses, fuelLiters, fuelMaxLiters);
}

function renderDA40NGView(container, typeConfig, stationMasses, fuelLiters, fuelMaxLiters) {
  const stationMap = {};
  for (const s of typeConfig.loadingStations) stationMap[s.id] = s;

  const mainFuel = typeConfig.fuelSystems[0];
  const mainFuelLiters = fuelLiters[mainFuel.id] || 0;
  const mainFuelMax = fuelMaxLiters[mainFuel.id] || mainFuel.maxLiters;

  const zoneData = DA40NG_ZONES.map(z => {
    let mass, maxMass, ratio;
    if (z.id === 'fuel') {
      mass = mainFuelLiters;
      maxMass = mainFuelMax;
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
  ${zoneData.map(z => {
    const massText = z.id === 'fuel' ? `${z.mass} L` : (z.mass > 0 ? `${z.mass} kg` : '—');
    const maxText = z.id === 'fuel' ? `max ${z.maxMass} L` : `max ${z.maxMass} kg`;
    return `
    <rect x="${z.x}" y="${z.y}" width="${z.w}" height="${z.h}" rx="4"
          fill="#12121f" stroke="none" pointer-events="none"/>
    <rect x="${z.x}" y="${z.y}" width="${z.w}" height="${z.h}" rx="4"
          fill="${getZoneColor(z.ratio)}" stroke="${getZoneBorder(z.ratio)}" stroke-width="2"
          class="zone-rect" data-zone="${z.id}" style="cursor:pointer"/>
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
  bindZoneClicks(container);
}

function renderGenericView(container, typeConfig, stationMasses, fuelLiters, fuelMaxLiters) {
  const items = [];

  // Stations
  for (const s of typeConfig.loadingStations) {
    const mass = stationMasses[s.id] || 0;
    const ratio = s.maxKg > 0 ? mass / s.maxKg : 0;
    const lang = document.documentElement.lang === 'en' ? 'en' : 'it';
    items.push({ id: s.id, label: lang === 'en' ? s.labelEn : s.labelIt, mass, maxMass: s.maxKg, ratio, unit: 'kg', isFuel: false });
  }

  // Fuel systems
  for (const fs of typeConfig.fuelSystems) {
    const liters = fuelLiters[fs.id] || 0;
    const maxL = fuelMaxLiters[fs.id] || fs.maxLiters;
    const ratio = maxL > 0 ? liters / maxL : 0;
    const lang = document.documentElement.lang === 'en' ? 'en' : 'it';
    items.push({ id: fs.id, label: lang === 'en' ? fs.labelEn : fs.labelIt, mass: liters, maxMass: maxL, ratio, unit: 'L', isFuel: true });
  }

  // Compact horizontal bar layout
  const barHeight = 22;
  const padding = 4;
  const svgH = items.length * (barHeight + padding) + padding;
  const svgW = 600;
  const labelW = 200;
  const barX = labelW + 10;
  const barW = svgW - barX - 80;

  let bars = '';
  items.forEach((item, i) => {
    const y = padding + i * (barHeight + padding);
    const fillW = Math.min(item.ratio, 1.2) / 1.2 * barW;
    const color = getZoneBorder(item.ratio);
    const textVal = item.mass > 0 ? `${item.mass} ${item.unit}` : '—';
    const maxVal = `${item.maxMass} ${item.unit}`;
    bars += `
      <text x="${labelW}" y="${y + barHeight / 2 + 1}" text-anchor="end" dominant-baseline="central"
            fill="rgba(255,255,255,0.7)" font-size="9" pointer-events="none">${item.label}</text>
      <rect x="${barX}" y="${y}" width="${barW}" height="${barHeight}" rx="3"
            fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
      <rect x="${barX}" y="${y}" width="${fillW}" height="${barHeight}" rx="3"
            fill="${getZoneColor(item.ratio)}" class="zone-rect" data-zone="${item.id}" style="cursor:pointer"/>
      <text x="${barX + barW / 2}" y="${y + barHeight / 2 + 1}" text-anchor="middle" dominant-baseline="central"
            fill="${getTextColor(item.ratio)}" font-size="9" font-weight="bold" pointer-events="none">${textVal}</text>
      <text x="${barX + barW + 6}" y="${y + barHeight / 2 + 1}" text-anchor="start" dominant-baseline="central"
            fill="rgba(255,255,255,0.4)" font-size="8" pointer-events="none">${maxVal}</text>
    `;
  });

  const svg = `<svg viewBox="0 0 ${svgW} ${svgH}" xmlns="http://www.w3.org/2000/svg" class="aircraft-svg">${bars}</svg>`;
  container.innerHTML = svg;
  bindZoneClicks(container);
}

function bindZoneClicks(container) {
  container.querySelectorAll('.zone-rect').forEach(rect => {
    rect.addEventListener('click', () => {
      const zoneId = rect.getAttribute('data-zone');
      // Try fuel input first
      const fuelInput = document.querySelector(`.fuel-input[data-fuel="${zoneId}"]`);
      if (fuelInput) { fuelInput.focus(); fuelInput.select(); return; }
      // Then station input
      const stationInput = document.querySelector(`[data-station="${zoneId}"]`);
      if (stationInput) { stationInput.focus(); stationInput.select(); }
    });
  });
}
