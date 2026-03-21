import { FLEET, LOADING_STATIONS, FUEL_DENSITY, FUEL_ARM, MAX_FUEL_LITERS, TANK_CONFIGS } from './fleet-data.js';
import { calculate } from './calculator.js';
import { renderEnvelope, renderMomentRange } from './cg-envelope.js';
import { renderAircraftView } from './aircraft-view.js';
import { t, getLang, setLang } from './i18n.js';
import { setPrintOptions, initPdfExport } from './pdf-export.js';

let selectedAircraft = null;
let lastResult = null;
let selectedTankConfig = TANK_CONFIGS.longRange;

function getMaxFuel() {
  return selectedTankConfig.maxFuelLiters;
}

// --- Aircraft List ---
function renderAircraftList() {
  const container = document.getElementById('aircraftList');
  container.innerHTML = '';
  for (const ac of FLEET) {
    const card = document.createElement('div');
    card.className = 'aircraft-card' + (selectedAircraft === ac ? ' selected' : '');
    card.innerHTML = `
      <div class="reg">${ac.registration}</div>
      <div class="detail">${ac.emptyWeight} kg · MTOM ${ac.maxTakeoffMass}</div>
      <div class="detail">${t('lastWeighing')}: ${ac.lastWeighing}</div>
    `;
    card.addEventListener('click', () => {
      selectedAircraft = ac;
      renderAircraftList();
      recalculate();
    });
    container.appendChild(card);
  }
}

// --- Calculation Table ---
function renderCalcTable() {
  // Save current input values before rebuilding
  const savedMasses = getStationMasses();
  const savedFuel = parseFloat(document.getElementById('fuelInput')?.value) || 0;

  const tbody = document.getElementById('calcBody');
  tbody.innerHTML = '';

  // Row 1: Empty mass (auto-filled)
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

  // Rows 2-8: Loading stations
  LOADING_STATIONS.forEach((station, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${i + 2}</td>
      <td data-i18n="${station.id}">${t(station.id)}</td>
      <td>${station.arm.toFixed(2)}</td>
      <td style="text-align:right">
        <input class="mass-input station-input" type="number" min="0" max="${station.maxKg}"
               step="0.1" value="0" data-station="${station.id}" data-max="${station.maxKg}" inputmode="decimal">
      </td>
      <td style="text-align:right" class="moment-cell" data-station-moment="${station.id}">0.00</td>
    `;
    tbody.appendChild(tr);
  });

  // Row 9: Total without fuel
  const row9 = document.createElement('tr');
  row9.className = 'subtotal-row no-fuel';
  row9.innerHTML = `
    <td>9</td>
    <td data-i18n="totalNoFuel">${t('totalNoFuel')}</td>
    <td>—</td>
    <td style="text-align:right" id="totalNoFuelMass">0.00</td>
    <td style="text-align:right" id="totalNoFuelMoment">0.00</td>
  `;
  tbody.appendChild(row9);

  // Restore saved values
  tbody.querySelectorAll('.station-input').forEach(input => {
    const saved = savedMasses[input.dataset.station];
    if (saved) input.value = saved;
    input.addEventListener('input', () => recalculate());
    input.addEventListener('change', () => { sanitizeInput(input); recalculate(); });
  });

  // Restore fuel
  const fuelInput = document.getElementById('fuelInput');
  if (savedFuel) fuelInput.value = savedFuel;
}

// --- Input Sanitization ---
// Called on 'change'/'blur' only, NOT on every keystroke,
// so the user can type decimal values like "12.5" without interference.
function sanitizeInput(input) {
  let val = parseFloat(input.value);
  if (isNaN(val) || val < 0) {
    input.value = 0;
    return;
  }
  // Round to 1 decimal
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

// --- Recalculate ---
function recalculate() {
  if (!selectedAircraft) return;

  const stationMasses = getStationMasses();
  const fuelLiters = parseFloat(document.getElementById('fuelInput').value) || 0;

  const result = calculate({ aircraft: selectedAircraft, stationMasses, fuelLiters, maxFuelLiters: getMaxFuel() });
  lastResult = result;

  // Update page title for PDF filename
  const dateVal = document.getElementById('flightDate').value.replace(/\//g, '-');
  document.title = `WB_${selectedAircraft.registration}_${dateVal}`;

  // Update station moments
  for (const station of LOADING_STATIONS) {
    const cell = document.querySelector(`[data-station-moment="${station.id}"]`);
    if (cell) cell.textContent = result.stationMoments[station.id].toFixed(2);
  }

  // Station warnings
  for (const station of LOADING_STATIONS) {
    const input = document.querySelector(`[data-station="${station.id}"]`);
    if (input) {
      input.classList.toggle('warning', result.stationWarnings[station.id] === 1);
    }
  }

  // Fuel display
  document.getElementById('fuelMassDisplay').textContent = result.fuelMass.toFixed(2);
  document.getElementById('fuelMomentDisplay').textContent = result.fuelMoment.toFixed(2);
  document.getElementById('maxFuelDisplay').textContent = getMaxFuel();

  // Fuel input warning
  const fuelInput = document.getElementById('fuelInput');
  fuelInput.classList.toggle('warning', result.fuelOverLimit === 1);

  // Totals
  document.getElementById('totalNoFuelMass').textContent = result.totalNoFuelMass.toFixed(2);
  document.getElementById('totalNoFuelMoment').textContent = result.totalNoFuelMoment.toFixed(2);

  // Totals section (row 11)
  const totalsSection = document.getElementById('totalsSection');
  totalsSection.innerHTML = `
    <table class="calc-table">
      <tr class="subtotal-row with-fuel">
        <td>11</td>
        <td data-i18n="totalWithFuel">${t('totalWithFuel')}</td>
        <td>—</td>
        <td style="text-align:right">${result.totalMass.toFixed(2)}</td>
        <td style="text-align:right">${result.totalMoment.toFixed(2)}</td>
      </tr>
    </table>
  `;

  // Results panel
  renderResults(result);

  // CG Diagram (6.4.4)
  const chartOpts = {
    maxTakeoffMass: selectedAircraft.maxTakeoffMass,
    cgNoFuel: result.cgNoFuel,
    massNoFuel: result.totalNoFuelMass,
    cgFull: result.cgFull,
    massFull: result.totalMass,
    momentNoFuel: result.totalNoFuelMoment,
    momentFull: result.totalMoment,
    cgFullInLimits: result.cgFullInLimits === 1,
  };
  renderEnvelope(document.getElementById('cgCanvas'), chartOpts);

  // Moment Range Diagram (6.4.5)
  renderMomentRange(document.getElementById('momentCanvas'), chartOpts);

  // Aircraft top-down view
  renderAircraftView(
    document.getElementById('aircraftView'),
    stationMasses, fuelLiters, getMaxFuel()
  );

  setPrintOptions({
    ...chartOpts,
  });
}

// --- Results Panel ---
function renderResults(result) {
  const grid = document.getElementById('resultGrid');
  const warnings = [];

  // No pilot warning
  if (result.noPilotWarning) warnings.push(t('enterPilotWeight'));
  // Overweight
  if (!result.massInLimits) warnings.push(`${t('overweight')}: ${result.totalMass.toFixed(1)} kg > ${result.maxTakeoffMass} kg`);
  // CG out of limits
  if (!result.cgFullInLimits && !result.noPilotWarning) warnings.push(t('outOfLimits'));
  // Fuel over
  if (result.fuelOverLimit) warnings.push(t('fuelOverLimit'));
  // Station warnings
  for (const station of LOADING_STATIONS) {
    if (result.stationWarnings[station.id]) {
      warnings.push(`${t(station.id)}: ${t('overStationLimit')}`);
    }
  }

  // Warning banner
  const banner = document.getElementById('warningBanner');
  if (warnings.length > 0) {
    banner.innerHTML = warnings.join('<br>');
    banner.classList.add('visible');
  } else {
    banner.classList.remove('visible');
  }

  // CG cards
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

// --- Re-render (called on language switch) ---
function renderUI() {
  renderAircraftList();
  renderCalcTable();
  applyTranslations();

  // Update language button active states
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === getLang());
  });

  if (selectedAircraft) {
    recalculate();
  } else {
    document.getElementById('resultGrid').innerHTML = `
      <div class="result-card neutral" style="grid-column: 1 / -1; padding: 20px;">
        <div class="result-label">${t('selectAircraft')}</div>
      </div>
    `;
    // Empty aircraft view
    const emptyMasses = {};
    LOADING_STATIONS.forEach(s => emptyMasses[s.id] = 0);
    renderAircraftView(document.getElementById('aircraftView'), emptyMasses, 0, getMaxFuel());
  }
}

// --- Init (runs once) ---
function initUI() {
  // Set today's date in dd/mm/yyyy format
  const dateInput = document.getElementById('flightDate');
  if (!dateInput.value) {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    dateInput.value = `${dd}/${mm}/${yyyy}`;
  }

  // Bind events ONCE
  const fuelInput = document.getElementById('fuelInput');
  fuelInput.max = getMaxFuel();
  fuelInput.addEventListener('input', () => recalculate());
  fuelInput.addEventListener('change', () => { sanitizeInput(fuelInput); recalculate(); });

  // Tank config selector
  document.getElementById('tankConfigSelect').addEventListener('change', (e) => {
    selectedTankConfig = TANK_CONFIGS[e.target.value];
    fuelInput.max = getMaxFuel();
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
    document.getElementById('fuelInput').value = 0;
    document.getElementById('tankConfigSelect').value = 'longRange';
    selectedTankConfig = TANK_CONFIGS.longRange;
    document.getElementById('fuelInput').max = getMaxFuel();
    document.title = 'DA40NG Mass & Balance — Urbe Flight School';
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
