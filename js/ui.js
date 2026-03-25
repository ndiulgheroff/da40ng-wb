import { AIRCRAFT_TYPES, TYPE_IDS } from './fleet-data.js';
import { calculate } from './calculator.js';
import { renderEnvelope, renderMomentRange } from './cg-envelope.js';
import { renderAircraftView } from './aircraft-view.js';
import { t, getLang, setLang } from './i18n.js';
import { setPrintOptions, initPdfExport } from './pdf-export.js';

let selectedType = null;      // e.g. AIRCRAFT_TYPES.DA40NG
let selectedAircraft = null;
let lastResult = null;
let selectedTankConfig = null; // only for types with tankConfigs

// --- Get effective max fuel liters per fuel system ---
function getFuelMaxLiters() {
  const result = {};
  if (!selectedType) return result;
  for (const fs of selectedType.fuelSystems) {
    let max = fs.maxLiters;
    if (selectedTankConfig && selectedTankConfig.fuelOverrides && selectedTankConfig.fuelOverrides[fs.id] != null) {
      max = selectedTankConfig.fuelOverrides[fs.id];
    }
    result[fs.id] = max;
  }
  return result;
}

// --- Active loading stations (filtered by selected aircraft's onlyFor) ---
function getActiveStations() {
  if (!selectedType) return [];
  return selectedType.loadingStations.filter(s => {
    if (!s.onlyFor) return true;
    if (!selectedAircraft) return false;
    return s.onlyFor.includes(selectedAircraft.registration);
  });
}

// --- Type Selector ---
function renderTypeSelector() {
  const container = document.getElementById('typeList');
  container.innerHTML = '';
  for (const typeId of TYPE_IDS) {
    const typeConf = AIRCRAFT_TYPES[typeId];
    const btn = document.createElement('button');
    btn.className = 'type-btn' + (selectedType === typeConf ? ' active' : '');
    btn.textContent = typeConf.label;
    btn.addEventListener('click', () => {
      if (selectedType === typeConf) return;
      selectedType = typeConf;
      selectedAircraft = null;
      lastResult = null;
      // Init tank config
      if (typeConf.tankConfigs && typeConf.defaultTankConfig) {
        selectedTankConfig = typeConf.tankConfigs[typeConf.defaultTankConfig];
      } else {
        selectedTankConfig = null;
      }
      renderUI();
    });
    container.appendChild(btn);
  }
}

// --- Aircraft List ---
function renderAircraftList() {
  const container = document.getElementById('aircraftList');
  container.innerHTML = '';
  if (!selectedType) return;
  for (const ac of selectedType.fleet) {
    const card = document.createElement('div');
    card.className = 'aircraft-card' + (selectedAircraft === ac ? ' selected' : '');
    card.innerHTML = `
      <div class="reg">${ac.registration}</div>
      <div class="detail">${ac.emptyWeight} kg · MTOM ${ac.maxTakeoffMass}</div>
      <div class="detail">${t('lastWeighing')}: ${ac.lastWeighing}</div>
    `;
    card.addEventListener('click', () => {
      const prevAircraft = selectedAircraft;
      selectedAircraft = ac;
      renderAircraftList();
      // Re-render stations if onlyFor filtering may have changed
      if (!prevAircraft || prevAircraft.registration !== ac.registration) {
        renderCalcTable();
        renderFuelSection();
      }
      recalculate();
    });
    container.appendChild(card);
  }
}

// --- Tank Config Selector ---
function renderTankConfig() {
  const wrapper = document.getElementById('tankConfigWrapper');
  if (!selectedType || !selectedType.tankConfigs) {
    wrapper.style.display = 'none';
    return;
  }
  wrapper.style.display = '';
  const select = document.getElementById('tankConfigSelect');
  select.innerHTML = '';
  const lang = getLang();
  for (const [key, cfg] of Object.entries(selectedType.tankConfigs)) {
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = lang === 'en' ? cfg.labelEn : cfg.labelIt;
    if (selectedTankConfig && selectedTankConfig.id === key) opt.selected = true;
    select.appendChild(opt);
  }
}

// --- Fuel Section ---
function renderFuelSection() {
  const container = document.getElementById('fuelSection');
  container.innerHTML = '';
  if (!selectedType) return;

  const lang = getLang();
  const maxLiters = getFuelMaxLiters();

  selectedType.fuelSystems.forEach((fs, idx) => {
    const rowNum = getActiveStations().length + 2 + idx; // +1 for empty mass row, +1 for total-no-fuel row
    const label = lang === 'en' ? fs.labelEn : fs.labelIt;
    const div = document.createElement('div');
    div.className = 'fuel-section';
    div.innerHTML = `
      <div class="fuel-header">
        <span><b>${rowNum}.</b> ${label} (${fs.density} kg/L) — Max: <span class="fuel-max-display" data-fuel="${fs.id}">${maxLiters[fs.id]}</span> L</span>
        <span class="fuel-arm-label">${t('armLabel')}: ${fs.arm} m</span>
      </div>
      <div class="fuel-input-row">
        <div>
          <div class="fuel-label">${t('fuelLiters')}</div>
          <input class="mass-input fuel-input" type="number" data-fuel="${fs.id}" min="0" max="${maxLiters[fs.id]}" step="1" value="0" inputmode="decimal">
        </div>
        <div class="fuel-arrow">&rarr;</div>
        <div>
          <div class="fuel-label">${t('massKg')}</div>
          <span class="fuel-mass-display" data-fuel="${fs.id}">0.00</span>
        </div>
        <div class="fuel-arrow">&rarr;</div>
        <div>
          <div class="fuel-label">${t('momentKgm')}</div>
          <span class="fuel-moment-display" data-fuel="${fs.id}">0.00</span>
        </div>
      </div>
    `;
    container.appendChild(div);
  });

  // Bind fuel input events
  container.querySelectorAll('.fuel-input').forEach(input => {
    input.addEventListener('input', () => recalculate());
    input.addEventListener('change', () => { sanitizeInput(input); recalculate(); });
  });
}

// --- Calculation Table ---
function renderCalcTable() {
  const savedMasses = getStationMasses();
  const tbody = document.getElementById('calcBody');
  tbody.innerHTML = '';

  if (!selectedType) return;

  // Row 1: Empty mass
  const row1 = document.createElement('tr');
  row1.className = 'auto-filled';
  row1.innerHTML = `
    <td>1</td>
    <td data-i18n="emptyMass">${t('emptyMass')}</td>
    <td>${selectedAircraft ? selectedAircraft.emptyArm.toFixed(3) : '—'}</td>
    <td style="text-align:right">${selectedAircraft ? selectedAircraft.emptyWeight.toFixed(2) : '—'}</td>
    <td style="text-align:right">${selectedAircraft ? selectedAircraft.emptyMoment.toFixed(2) : '—'}</td>
  `;
  tbody.appendChild(row1);

  // Loading station rows
  getActiveStations().forEach((station, i) => {
    const tr = document.createElement('tr');
    const lang = getLang();
    const label = lang === 'en' ? station.labelEn : station.labelIt;
    tr.innerHTML = `
      <td>${i + 2}</td>
      <td>${label}</td>
      <td>${station.arm.toFixed(station.arm < 1 ? 3 : 2)}</td>
      <td style="text-align:right">
        <input class="mass-input station-input" type="number" min="0" max="${station.maxKg}"
               step="0.1" value="0" data-station="${station.id}" data-max="${station.maxKg}" inputmode="decimal">
      </td>
      <td style="text-align:right" class="moment-cell" data-station-moment="${station.id}">0.00</td>
    `;
    tbody.appendChild(tr);
  });

  // Total without fuel row
  const rowNoFuel = document.createElement('tr');
  const noFuelNum = getActiveStations().length + 2;
  rowNoFuel.className = 'subtotal-row no-fuel';
  rowNoFuel.innerHTML = `
    <td>${noFuelNum}</td>
    <td>${t('totalNoFuel')}</td>
    <td>—</td>
    <td style="text-align:right" id="totalNoFuelMass">0.00</td>
    <td style="text-align:right" id="totalNoFuelMoment">0.00</td>
  `;
  tbody.appendChild(rowNoFuel);

  // Restore saved station values
  tbody.querySelectorAll('.station-input').forEach(input => {
    const saved = savedMasses[input.dataset.station];
    if (saved) input.value = saved;
    input.addEventListener('input', () => recalculate());
    input.addEventListener('change', () => { sanitizeInput(input); recalculate(); });
  });
}

// --- Input Sanitization ---
function sanitizeInput(input) {
  let val = parseFloat(input.value);
  if (isNaN(val) || val < 0) {
    input.value = 0;
    return;
  }
  val = Math.round(val * 10) / 10;
  input.value = val;
}

// --- Gather Station Masses ---
function getStationMasses() {
  const masses = {};
  document.querySelectorAll('.station-input').forEach(input => {
    masses[input.dataset.station] = parseFloat(input.value) || 0;
  });
  return masses;
}

// --- Gather Fuel Liters ---
function getFuelInputLiters() {
  const liters = {};
  document.querySelectorAll('.fuel-input').forEach(input => {
    liters[input.dataset.fuel] = parseFloat(input.value) || 0;
  });
  return liters;
}

// --- Recalculate ---
function recalculate() {
  if (!selectedAircraft || !selectedType) return;

  const stationMasses = getStationMasses();
  const fuelLiters = getFuelInputLiters();
  const fuelMaxLiters = getFuelMaxLiters();

  const result = calculate({
    aircraft: selectedAircraft,
    typeConfig: selectedType,
    stationMasses,
    fuelLiters,
    fuelMaxLiters,
  });
  lastResult = result;

  // Update page title for PDF filename
  const dateVal = document.getElementById('flightDate').value.replace(/\//g, '-');
  document.title = `WB_${selectedAircraft.registration}_${dateVal}`;

  // Update station moments
  for (const station of getActiveStations()) {
    const cell = document.querySelector(`[data-station-moment="${station.id}"]`);
    if (cell) cell.textContent = result.stationMoments[station.id].toFixed(2);
  }

  // Station warnings
  for (const station of getActiveStations()) {
    const input = document.querySelector(`[data-station="${station.id}"]`);
    if (input) {
      input.classList.toggle('warning', result.stationWarnings[station.id] === 1);
    }
  }

  // Fuel displays
  for (const fs of selectedType.fuelSystems) {
    const detail = result.fuelDetails[fs.id];
    const massEl = document.querySelector(`.fuel-mass-display[data-fuel="${fs.id}"]`);
    const momEl = document.querySelector(`.fuel-moment-display[data-fuel="${fs.id}"]`);
    const maxEl = document.querySelector(`.fuel-max-display[data-fuel="${fs.id}"]`);
    const input = document.querySelector(`.fuel-input[data-fuel="${fs.id}"]`);
    if (massEl) massEl.textContent = detail.mass.toFixed(2);
    if (momEl) momEl.textContent = detail.moment.toFixed(2);
    if (maxEl) maxEl.textContent = detail.maxLiters;
    if (input) {
      input.max = detail.maxLiters;
      input.classList.toggle('warning', result.fuelOverLimits[fs.id] === 1);
    }
  }

  // Totals
  document.getElementById('totalNoFuelMass').textContent = result.totalNoFuelMass.toFixed(2);
  document.getElementById('totalNoFuelMoment').textContent = result.totalNoFuelMoment.toFixed(2);

  // Totals section
  const totalRowNum = getActiveStations().length + 2 + selectedType.fuelSystems.length;
  const totalsSection = document.getElementById('totalsSection');
  totalsSection.innerHTML = `
    <table class="calc-table">
      <tr class="subtotal-row with-fuel">
        <td>${totalRowNum}</td>
        <td>${t('totalWithFuel')}</td>
        <td>—</td>
        <td style="text-align:right">${result.totalMass.toFixed(2)}</td>
        <td style="text-align:right">${result.totalMoment.toFixed(2)}</td>
      </tr>
    </table>
  `;

  // Results panel
  renderResults(result);

  // CG Diagram
  const chartOpts = {
    maxTakeoffMass: selectedAircraft.maxTakeoffMass,
    cgEnvelopes: selectedType.cgEnvelopes,
    maxZeroFuelMass: selectedType.maxZeroFuelMass,
    cgNoFuel: result.cgNoFuel,
    massNoFuel: result.totalNoFuelMass,
    cgFull: result.cgFull,
    massFull: result.totalMass,
    momentNoFuel: result.totalNoFuelMoment,
    momentFull: result.totalMoment,
    cgFullInLimits: result.cgFullInLimits === 1,
  };
  renderEnvelope(document.getElementById('cgCanvas'), chartOpts, selectedType.chartScales);
  renderMomentRange(document.getElementById('momentCanvas'), chartOpts, selectedType.chartScales);

  // Aircraft top-down view
  renderAircraftView(
    document.getElementById('aircraftView'),
    selectedType, stationMasses, fuelLiters, fuelMaxLiters,
    selectedAircraft ? selectedAircraft.registration : null
  );

  setPrintOptions({ ...chartOpts, chartScales: selectedType.chartScales });
}

// --- Results Panel ---
function renderResults(result) {
  const grid = document.getElementById('resultGrid');
  const warnings = [];

  if (result.noPilotWarning) warnings.push(t('enterPilotWeight'));
  if (!result.massInLimits) warnings.push(`${t('overweight')}: ${result.totalMass.toFixed(1)} kg > ${result.maxTakeoffMass} kg`);
  if (!result.cgFullInLimits && !result.noPilotWarning) warnings.push(t('outOfLimits'));
  if (result.fuelOverLimit) warnings.push(t('fuelOverLimit'));
  for (const station of getActiveStations()) {
    if (result.stationWarnings[station.id]) {
      const lang = getLang();
      const label = lang === 'en' ? station.labelEn : station.labelIt;
      warnings.push(`${label}: ${t('overStationLimit')}`);
    }
  }

  const banner = document.getElementById('warningBanner');
  if (warnings.length > 0) {
    banner.innerHTML = warnings.join('<br>');
    banner.classList.add('visible');
  } else {
    banner.classList.remove('visible');
  }

  const cgNoFuelClass = 'ref';
  const cgFullClass = result.noPilotWarning ? 'neutral' :
                       (result.cgFullInLimits ? 'ok' : 'fail');
  const massClass = result.massInLimits ? 'ok' : 'fail';
  const margin = result.maxTakeoffMass - result.totalMass;

  grid.innerHTML = `
    <div class="result-card ${cgNoFuelClass}">
      <div class="result-label">${t('cgNoFuel')}</div>
      <div class="result-value">${result.noPilotWarning ? '—' : result.cgNoFuel.toFixed(3) + ' m'}</div>
      <div class="result-status">${t('reference')}</div>
    </div>
    <div class="result-card ${cgFullClass}">
      <div class="result-label">${t('cgWithFuel')}</div>
      <div class="result-value">${result.noPilotWarning ? '—' : result.cgFull.toFixed(3) + ' m'}</div>
      <div class="result-status">${result.noPilotWarning ? '—' : (result.cgFullInLimits ? t('withinLimits') : t('outOfLimits'))}</div>
    </div>
    <div class="result-card ${massClass}">
      <div class="result-label">${t('takeoffMass')}</div>
      <div class="result-value">${result.totalMass.toFixed(1)} kg</div>
      <div class="result-status">${result.massInLimits ? '✓ < ' + result.maxTakeoffMass + ' kg' : t('overweight')}</div>
    </div>
    <div class="result-card neutral">
      <div class="result-label">${t('margin')}</div>
      <div class="result-value" style="color: ${margin >= 0 ? 'var(--green)' : 'var(--red)'}">${margin.toFixed(1)} kg</div>
      <div class="result-status">${t('available')}</div>
    </div>
  `;
}

// --- i18n: update all data-i18n elements ---
function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });
}

// --- Re-render (called on type/language switch) ---
function renderUI() {
  renderTypeSelector();
  renderAircraftList();
  renderTankConfig();
  renderCalcTable();
  renderFuelSection();
  applyTranslations();

  // Update app title to include type
  const titleEl = document.querySelector('.topbar-title');
  if (titleEl) {
    titleEl.textContent = selectedType
      ? `${selectedType.label} Mass & Balance`
      : t('appTitle');
  }

  // Update language button active states
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === getLang());
  });

  if (selectedAircraft && selectedType) {
    recalculate();
  } else {
    document.getElementById('resultGrid').innerHTML = `
      <div class="result-card neutral" style="grid-column: 1 / -1; padding: 20px;">
        <div class="result-label">${selectedType ? t('selectAircraft') : t('selectType')}</div>
      </div>
    `;
    document.getElementById('warningBanner').classList.remove('visible');
    document.getElementById('totalsSection').innerHTML = '';
    // Clear aircraft view
    renderAircraftView(document.getElementById('aircraftView'), selectedType, {}, {}, {}, null);
  }
}

// --- Init ---
function initUI() {
  // Set today's date
  const dateInput = document.getElementById('flightDate');
  if (!dateInput.value) {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    dateInput.value = `${dd}/${mm}/${yyyy}`;
  }

  // Tank config selector
  document.getElementById('tankConfigSelect').addEventListener('change', (e) => {
    if (!selectedType || !selectedType.tankConfigs) return;
    selectedTankConfig = selectedType.tankConfigs[e.target.value];
    // Update fuel max displays and re-render fuel section
    const maxLiters = getFuelMaxLiters();
    document.querySelectorAll('.fuel-input').forEach(input => {
      const fsId = input.dataset.fuel;
      if (maxLiters[fsId] != null) input.max = maxLiters[fsId];
    });
    document.querySelectorAll('.fuel-max-display').forEach(el => {
      const fsId = el.dataset.fuel;
      if (maxLiters[fsId] != null) el.textContent = maxLiters[fsId];
    });
    recalculate();
  });

  // Reset button
  document.getElementById('btnReset').addEventListener('click', () => {
    selectedAircraft = null;
    lastResult = null;
    document.getElementById('instructorName').value = '';
    document.getElementById('studentName').value = '';
    const now = new Date();
    document.getElementById('flightDate').value = `${String(now.getDate()).padStart(2,'0')}/${String(now.getMonth()+1).padStart(2,'0')}/${now.getFullYear()}`;
    if (selectedType && selectedType.tankConfigs && selectedType.defaultTankConfig) {
      selectedTankConfig = selectedType.tankConfigs[selectedType.defaultTankConfig];
    }
    document.title = 'Mass & Balance — Urbe Flight School';
    renderUI();
  });

  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      setLang(btn.dataset.lang);
      renderUI();
    });
  });

  // Print / Save PDF button
  document.getElementById('btnPrint').addEventListener('click', () => {
    window.print();
  });

  initPdfExport(document.getElementById('cgCanvas'), document.getElementById('momentCanvas'));

  // Initial render
  renderUI();
}

initUI();
