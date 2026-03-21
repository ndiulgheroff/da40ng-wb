import { FLEET, LOADING_STATIONS, FUEL_DENSITY, FUEL_ARM, MAX_FUEL_LITERS } from './fleet-data.js';
import { calculate } from './calculator.js';
import { renderEnvelope } from './cg-envelope.js';
import { t, getLang, setLang } from './i18n.js';
import { setPrintOptions, initPdfExport } from './pdf-export.js';

let selectedAircraft = null;
let lastResult = null;

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
               step="0.1" value="0" data-station="${station.id}" data-max="${station.maxKg}">
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

  const result = calculate({ aircraft: selectedAircraft, stationMasses, fuelLiters });
  lastResult = result;

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

  // CG Diagram
  renderEnvelope(document.getElementById('cgCanvas'), {
    maxTakeoffMass: selectedAircraft.maxTakeoffMass,
    cgNoFuel: result.cgNoFuel,
    massNoFuel: result.totalNoFuelMass,
    cgFull: result.cgFull,
    massFull: result.totalMass,
    cgFullInLimits: result.cgFullInLimits === 1,
  });

  setPrintOptions({
    maxTakeoffMass: selectedAircraft.maxTakeoffMass,
    cgNoFuel: result.cgNoFuel,
    massNoFuel: result.totalNoFuelMass,
    cgFull: result.cgFull,
    massFull: result.totalMass,
    cgFullInLimits: result.cgFullInLimits === 1,
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
  fuelInput.addEventListener('input', () => recalculate());
  fuelInput.addEventListener('change', () => { sanitizeInput(fuelInput); recalculate(); });

  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      setLang(btn.dataset.lang);
      renderUI();
    });
  });

  // Export dropdown
  const btnExport = document.getElementById('btnExport');
  const exportMenu = document.getElementById('exportMenu');

  btnExport.addEventListener('click', (e) => {
    e.stopPropagation();
    exportMenu.classList.toggle('open');
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', () => {
    exportMenu.classList.remove('open');
  });

  // Print button
  document.getElementById('btnPrint').addEventListener('click', () => {
    exportMenu.classList.remove('open');
    window.print();
  });

  // Download PDF — opens a clean print-ready page in a new window for saving as PDF
  document.getElementById('btnDownloadPdf').addEventListener('click', () => {
    exportMenu.classList.remove('open');
    if (!selectedAircraft) return;

    // Render CG diagram in print mode to get a clean canvas
    const cgCanvas = document.getElementById('cgCanvas');
    const origDpr = window.devicePixelRatio;
    Object.defineProperty(window, 'devicePixelRatio', { value: 2, writable: true, configurable: true });
    renderEnvelope(cgCanvas, {
      maxTakeoffMass: selectedAircraft.maxTakeoffMass,
      cgNoFuel: lastResult.cgNoFuel,
      massNoFuel: lastResult.totalNoFuelMass,
      cgFull: lastResult.cgFull,
      massFull: lastResult.totalMass,
      cgFullInLimits: lastResult.cgFullInLimits === 1,
    }, true);
    const cgImageData = cgCanvas.toDataURL('image/png');
    // Restore normal rendering
    Object.defineProperty(window, 'devicePixelRatio', { value: origDpr, writable: true, configurable: true });
    renderEnvelope(cgCanvas, {
      maxTakeoffMass: selectedAircraft.maxTakeoffMass,
      cgNoFuel: lastResult.cgNoFuel,
      massNoFuel: lastResult.totalNoFuelMass,
      cgFull: lastResult.cgFull,
      massFull: lastResult.totalMass,
      cgFullInLimits: lastResult.cgFullInLimits === 1,
    });

    // Build station rows
    let stationRows = '';
    const masses = getStationMasses();
    stationRows += `<tr style="color:#2E7D32"><td>1</td><td>${t('emptyMass')}</td><td>${selectedAircraft.emptyArm.toFixed(3)}</td><td style="text-align:right">${selectedAircraft.emptyWeight.toFixed(2)}</td><td style="text-align:right">${selectedAircraft.emptyMoment.toFixed(2)}</td></tr>`;
    LOADING_STATIONS.forEach((s, i) => {
      const m = masses[s.id] || 0;
      const mom = lastResult.stationMoments[s.id].toFixed(2);
      stationRows += `<tr><td>${i+2}</td><td>${t(s.id)}</td><td>${s.arm.toFixed(2)}</td><td style="text-align:right">${m}</td><td style="text-align:right">${mom}</td></tr>`;
    });
    stationRows += `<tr style="font-weight:bold;border-top:2px solid #333;color:#e65100"><td>9</td><td>${t('totalNoFuel')}</td><td>—</td><td style="text-align:right">${lastResult.totalNoFuelMass.toFixed(2)}</td><td style="text-align:right">${lastResult.totalNoFuelMoment.toFixed(2)}</td></tr>`;
    stationRows += `<tr style="background:#f1f8e9"><td>10</td><td>${t('fuel')} (${lastResult.fuelMass.toFixed(2)} kg)</td><td>2.63</td><td style="text-align:right">${lastResult.fuelMass.toFixed(2)}</td><td style="text-align:right">${lastResult.fuelMoment.toFixed(2)}</td></tr>`;
    stationRows += `<tr style="font-weight:bold;border-top:2px solid #333;color:#2E7D32"><td>11</td><td>${t('totalWithFuel')}</td><td>—</td><td style="text-align:right">${lastResult.totalMass.toFixed(2)}</td><td style="text-align:right">${lastResult.totalMoment.toFixed(2)}</td></tr>`;

    const cgStatus = lastResult.cgFullInLimits ? `✓ ${t('withinLimits')}` : `✗ ${t('outOfLimits')}`;
    const cgColor = lastResult.cgFullInLimits ? '#2E7D32' : '#c62828';
    const massStatus = lastResult.massInLimits ? `✓ < ${lastResult.maxTakeoffMass} kg` : `✗ ${t('overweight')}`;
    const massColor = lastResult.massInLimits ? '#2E7D32' : '#c62828';

    const reg = selectedAircraft.registration;
    const dateVal = document.getElementById('flightDate').value;
    const instructor = document.getElementById('instructorName').value || '—';
    const student = document.getElementById('studentName').value || '—';

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>W&B ${reg} ${dateVal}</title>
<style>
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;margin:20px;color:#000;font-size:12px}
  h1{font-size:18px;margin:0}
  .header{display:flex;justify-content:space-between;border-bottom:2px solid #000;padding-bottom:8px;margin-bottom:12px}
  .info{font-size:11px;color:#555}
  table{width:100%;border-collapse:collapse;margin-bottom:12px;font-size:12px}
  th{text-align:left;padding:4px;border-bottom:1px solid #333;font-size:10px;color:#555}
  th:nth-child(4),th:nth-child(5){text-align:right}
  td{padding:4px;border-bottom:1px solid #ddd}
  td:nth-child(4),td:nth-child(5){text-align:right}
  .results{display:flex;gap:16px;margin-bottom:12px}
  .result-box{border:1px solid #333;border-radius:4px;padding:8px 12px;text-align:center;flex:1}
  .result-box .label{font-size:10px;color:#555}
  .result-box .value{font-size:18px;font-weight:bold;margin:2px 0}
  .result-box .status{font-size:10px;font-weight:bold}
  .diagram{text-align:center;margin-top:8px}
  .diagram img{max-width:100%;border:1px solid #ccc;border-radius:4px}
  .footer{text-align:center;font-size:9px;color:#999;border-top:1px solid #ccc;padding-top:6px;margin-top:16px}
  @media print{body{margin:10px}}
</style></head><body>
<div class="header">
  <div><h1>DA40NG Mass & Balance — ${reg}</h1><div class="info">Urbe Flight School</div></div>
  <div style="text-align:right"><div><b>${t('date')}:</b> ${dateVal}</div><div><b>${t('instructor')}:</b> ${instructor}</div><div><b>${t('student')}:</b> ${student}</div></div>
</div>
<table><thead><tr><th>#</th><th>${t('station')}</th><th>${t('arm')}</th><th>${t('massKg')}</th><th>${t('momentKgm')}</th></tr></thead><tbody>${stationRows}</tbody></table>
<div class="results">
  <div class="result-box"><div class="label">${t('cgWithFuel')}</div><div class="value" style="color:${cgColor}">${lastResult.cgFull.toFixed(3)} m</div><div class="status" style="color:${cgColor}">${cgStatus}</div></div>
  <div class="result-box"><div class="label">${t('takeoffMass')}</div><div class="value" style="color:${massColor}">${lastResult.totalMass.toFixed(1)} kg</div><div class="status" style="color:${massColor}">${massStatus}</div></div>
  <div class="result-box"><div class="label">${t('margin')}</div><div class="value">${(lastResult.maxTakeoffMass - lastResult.totalMass).toFixed(1)} kg</div><div class="status">${t('available')}</div></div>
</div>
<div class="diagram"><img src="${cgImageData}"></div>
<div class="footer">${t('generatedBy')}</div>
<script>window.onload=()=>{window.print();}</script>
</body></html>`;

    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
  });

  initPdfExport(document.getElementById('cgCanvas'));

  // Initial render
  renderUI();
}

initUI();
