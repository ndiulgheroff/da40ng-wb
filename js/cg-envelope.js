import { t } from './i18n.js';

const MARGIN = { top: 40, right: 30, bottom: 50, left: 70 };

/**
 * 6.4.4 PERMISSIBLE CENTER OF GRAVITY RANGE
 * X: CG Position (m), Y: Flight Mass (kg)
 *
 * @param {HTMLCanvasElement} canvas
 * @param {object} options — cgNoFuel, massNoFuel, cgFull, massFull, maxTakeoffMass, cgFullInLimits, cgEnvelopes, maxZeroFuelMass
 * @param {object} scales — { cg: {min,max,step,labelStep}, mass: {min,max,step,labelStep} }
 * @param {boolean} printMode
 */
export function renderEnvelope(canvas, options, scales, printMode = false) {
  const dpr = window.devicePixelRatio || 1;
  const displayW = canvas.clientWidth;
  const displayH = canvas.clientHeight;
  canvas.width = displayW * dpr;
  canvas.height = displayH * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const CG_MIN = scales.cg.min, CG_MAX = scales.cg.max;
  const MASS_MIN = scales.mass.min, MASS_MAX = scales.mass.max;
  const w = displayW - MARGIN.left - MARGIN.right;
  const h = displayH - MARGIN.top - MARGIN.bottom;
  const toCx = cg => MARGIN.left + (cg - CG_MIN) / (CG_MAX - CG_MIN) * w;
  const toCy = mass => MARGIN.top + h - (mass - MASS_MIN) / (MASS_MAX - MASS_MIN) * h;

  const pm = printMode;
  const bg = pm ? '#fff' : '#1a1a2e';
  const fg = pm ? '#000' : '#ccc';
  const gridC = pm ? '#ccc' : '#2a2a4a';
  const envStroke = pm ? '#000' : '#4CAF50';
  const envFill = pm ? 'rgba(0,0,0,0.04)' : 'rgba(76,175,80,0.12)';

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, displayW, displayH);

  ctx.strokeStyle = pm ? '#000' : '#555';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(MARGIN.left, MARGIN.top, w, h);

  // Grid
  ctx.strokeStyle = gridC;
  ctx.lineWidth = 0.5;
  for (let cg = CG_MIN; cg <= CG_MAX; cg += scales.cg.step) {
    ctx.beginPath(); ctx.moveTo(toCx(cg), MARGIN.top); ctx.lineTo(toCx(cg), MARGIN.top + h); ctx.stroke();
  }
  for (let m = MASS_MIN; m <= MASS_MAX; m += scales.mass.step) {
    ctx.beginPath(); ctx.moveTo(MARGIN.left, toCy(m)); ctx.lineTo(MARGIN.left + w, toCy(m)); ctx.stroke();
  }

  // Envelope
  const envelope = options.cgEnvelopes[options.maxTakeoffMass];
  if (envelope) {
    const fwd = envelope.map(p => [p.cgFwd, p.mass]);
    const aft = envelope.map(p => [p.cgAft, p.mass]).reverse();
    const poly = [...fwd, ...aft];
    ctx.fillStyle = envFill;
    ctx.beginPath();
    poly.forEach(([cg, m], i) => i === 0 ? ctx.moveTo(toCx(cg), toCy(m)) : ctx.lineTo(toCx(cg), toCy(m)));
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = envStroke;
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }

  // Dashed lines
  function dashLine(mass, label) {
    if (mass < MASS_MIN || mass > MASS_MAX) return;
    ctx.save();
    ctx.strokeStyle = pm ? '#555' : '#888';
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 4]);
    const y = toCy(mass);
    ctx.beginPath(); ctx.moveTo(MARGIN.left + 1, y); ctx.lineTo(MARGIN.left + w - 1, y); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = pm ? '#000' : '#aaa';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(label, MARGIN.left + w - 4, y - 4);
    ctx.restore();
  }
  dashLine(options.maxTakeoffMass, `MTOM ${options.maxTakeoffMass} kg`);
  if (options.maxZeroFuelMass) {
    dashLine(options.maxZeroFuelMass, `Max Zero Fuel Mass ${options.maxZeroFuelMass} kg`);
  }

  // Axes labels
  ctx.fillStyle = fg;
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  const cgLabelStep = scales.cg.labelStep || scales.cg.step;
  for (let cg = CG_MIN; cg <= CG_MAX + 0.001; cg += cgLabelStep) {
    const cx = toCx(cg);
    ctx.beginPath(); ctx.moveTo(cx, MARGIN.top + h); ctx.lineTo(cx, MARGIN.top + h + 4); ctx.strokeStyle = fg; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillText(cg.toFixed(2), cx, MARGIN.top + h + 18);
  }
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText('Center of Gravity Position [m]', MARGIN.left + w / 2, MARGIN.top + h + 38);

  ctx.font = '12px sans-serif';
  ctx.textAlign = 'right';
  const massLabelStep = scales.mass.labelStep || scales.mass.step;
  for (let m = MASS_MIN; m <= MASS_MAX; m += massLabelStep) {
    ctx.beginPath(); ctx.moveTo(MARGIN.left - 4, toCy(m)); ctx.lineTo(MARGIN.left, toCy(m)); ctx.strokeStyle = fg; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillText(m.toString(), MARGIN.left - 8, toCy(m) + 4);
  }
  ctx.save();
  ctx.translate(14, MARGIN.top + h / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText('Flight Mass [kg]', 0, 0);
  ctx.restore();

  // Title
  ctx.fillStyle = fg;
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('PERMISSIBLE CENTER OF GRAVITY RANGE', MARGIN.left + w / 2, MARGIN.top - 14);

  // Plot points and connecting line
  const pts = [];
  if (options.cgNoFuel != null && options.massNoFuel > 0) pts.push({ x: toCx(options.cgNoFuel), y: toCy(options.massNoFuel), color: '#FF9800', label: t('cgNoFuel') });
  if (options.cgFull != null && options.massFull > 0) pts.push({ x: toCx(options.cgFull), y: toCy(options.massFull), color: options.cgFullInLimits ? '#4CAF50' : '#f44336', label: t('cgWithFuel') });

  if (pts.length === 2) {
    ctx.save();
    ctx.strokeStyle = pm ? '#333' : '#aaa';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 3]);
    ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y); ctx.lineTo(pts[1].x, pts[1].y); ctx.stroke();
    ctx.setLineDash([]);
    const dx = pts[1].x - pts[0].x, dy = pts[1].y - pts[0].y;
    const angle = Math.atan2(dy, dx);
    const aLen = 10;
    ctx.fillStyle = pm ? '#333' : '#aaa';
    ctx.beginPath();
    ctx.moveTo(pts[1].x, pts[1].y);
    ctx.lineTo(pts[1].x - aLen * Math.cos(angle - 0.4), pts[1].y - aLen * Math.sin(angle - 0.4));
    ctx.lineTo(pts[1].x - aLen * Math.cos(angle + 0.4), pts[1].y - aLen * Math.sin(angle + 0.4));
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  pts.forEach((p, i) => {
    const sz = 8;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y - sz);
    ctx.lineTo(p.x - sz * 0.7, p.y + sz * 0.5);
    ctx.lineTo(p.x + sz * 0.7, p.y + sz * 0.5);
    ctx.closePath();
    ctx.fillStyle = p.color;
    ctx.fill();
    ctx.strokeStyle = pm ? '#000' : '#fff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const offY = i === 0 ? -16 : 20;
    ctx.font = 'bold 12px sans-serif';
    const tw = ctx.measureText(p.label).width;
    ctx.fillStyle = pm ? 'rgba(255,255,255,0.85)' : 'rgba(26,26,46,0.85)';
    ctx.fillRect(p.x + 12, p.y + offY - 11, tw + 6, 16);
    ctx.fillStyle = p.color;
    ctx.textAlign = 'left';
    ctx.fillText(p.label, p.x + 15, p.y + offY);
  });
}

/**
 * PERMISSIBLE MOMENT RANGE
 * X: Flight Mass Moment (kgm), Y: Flight Mass (kg)
 */
export function renderMomentRange(canvas, options, scales, printMode = false) {
  const dpr = window.devicePixelRatio || 1;
  const displayW = canvas.clientWidth;
  const displayH = canvas.clientHeight;
  canvas.width = displayW * dpr;
  canvas.height = displayH * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const MOM_MIN = scales.moment.min, MOM_MAX = scales.moment.max;
  const MASS_MIN = scales.mass.min, MASS_MAX = scales.mass.max;
  const w = displayW - MARGIN.left - MARGIN.right;
  const h = displayH - MARGIN.top - MARGIN.bottom;
  const toMx = mom => MARGIN.left + (mom - MOM_MIN) / (MOM_MAX - MOM_MIN) * w;
  const toCy = mass => MARGIN.top + h - (mass - MASS_MIN) / (MASS_MAX - MASS_MIN) * h;

  const pm = printMode;
  const bg = pm ? '#fff' : '#1a1a2e';
  const fg = pm ? '#000' : '#ccc';
  const gridC = pm ? '#ccc' : '#2a2a4a';
  const envStroke = pm ? '#000' : '#4CAF50';
  const envFill = pm ? 'rgba(0,0,0,0.04)' : 'rgba(76,175,80,0.12)';

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, displayW, displayH);

  ctx.strokeStyle = pm ? '#000' : '#555';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(MARGIN.left, MARGIN.top, w, h);

  // Grid
  ctx.strokeStyle = gridC;
  ctx.lineWidth = 0.5;
  for (let mom = MOM_MIN; mom <= MOM_MAX; mom += scales.moment.step) {
    ctx.beginPath(); ctx.moveTo(toMx(mom), MARGIN.top); ctx.lineTo(toMx(mom), MARGIN.top + h); ctx.stroke();
  }
  for (let m = MASS_MIN; m <= MASS_MAX; m += scales.mass.step) {
    ctx.beginPath(); ctx.moveTo(MARGIN.left, toCy(m)); ctx.lineTo(MARGIN.left + w, toCy(m)); ctx.stroke();
  }

  // Moment envelope from CG envelope
  const envelope = options.cgEnvelopes[options.maxTakeoffMass];
  if (envelope) {
    const fwd = envelope.map(p => [p.mass * p.cgFwd, p.mass]);
    const aft = envelope.map(p => [p.mass * p.cgAft, p.mass]).reverse();
    const poly = [...fwd, ...aft];
    ctx.fillStyle = envFill;
    ctx.beginPath();
    poly.forEach(([mom, m], i) => i === 0 ? ctx.moveTo(toMx(mom), toCy(m)) : ctx.lineTo(toMx(mom), toCy(m)));
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = envStroke;
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }

  // Dashed lines
  function dashLine(mass, label) {
    if (mass < MASS_MIN || mass > MASS_MAX) return;
    ctx.save();
    ctx.strokeStyle = pm ? '#555' : '#888';
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 4]);
    const y = toCy(mass);
    ctx.beginPath(); ctx.moveTo(MARGIN.left + 1, y); ctx.lineTo(MARGIN.left + w - 1, y); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = pm ? '#000' : '#aaa';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(label, MARGIN.left + w - 4, y - 4);
    ctx.restore();
  }
  dashLine(options.maxTakeoffMass, `MTOM ${options.maxTakeoffMass} kg`);
  if (options.maxZeroFuelMass) {
    dashLine(options.maxZeroFuelMass, `Max Zero Fuel Mass ${options.maxZeroFuelMass} kg`);
  }

  // Axes
  ctx.fillStyle = fg;
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  const momLabelStep = scales.moment.labelStep || scales.moment.step;
  for (let mom = MOM_MIN; mom <= MOM_MAX; mom += momLabelStep) {
    ctx.beginPath(); ctx.moveTo(toMx(mom), MARGIN.top + h); ctx.lineTo(toMx(mom), MARGIN.top + h + 4); ctx.strokeStyle = fg; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillText(mom.toString(), toMx(mom), MARGIN.top + h + 18);
  }
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText('Flight Mass Moment [kgm]', MARGIN.left + w / 2, MARGIN.top + h + 38);

  ctx.font = '12px sans-serif';
  ctx.textAlign = 'right';
  const massLabelStep = scales.mass.labelStep || scales.mass.step;
  for (let m = MASS_MIN; m <= MASS_MAX; m += massLabelStep) {
    ctx.beginPath(); ctx.moveTo(MARGIN.left - 4, toCy(m)); ctx.lineTo(MARGIN.left, toCy(m)); ctx.strokeStyle = fg; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillText(m.toString(), MARGIN.left - 8, toCy(m) + 4);
  }
  ctx.save();
  ctx.translate(14, MARGIN.top + h / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText('Flight Mass [kg]', 0, 0);
  ctx.restore();

  // Title
  ctx.fillStyle = fg;
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('PERMISSIBLE MOMENT RANGE', MARGIN.left + w / 2, MARGIN.top - 14);

  // Plot points
  const momNoFuel = options.massNoFuel > 0 ? options.momentNoFuel : null;
  const momFull = options.massFull > 0 ? options.momentFull : null;
  const pts = [];
  if (momNoFuel != null && options.massNoFuel > 0) pts.push({ x: toMx(momNoFuel), y: toCy(options.massNoFuel), color: '#FF9800', label: t('cgNoFuel') });
  if (momFull != null && options.massFull > 0) pts.push({ x: toMx(momFull), y: toCy(options.massFull), color: options.cgFullInLimits ? '#4CAF50' : '#f44336', label: t('cgWithFuel') });

  if (pts.length === 2) {
    ctx.save();
    ctx.strokeStyle = pm ? '#333' : '#aaa';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 3]);
    ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y); ctx.lineTo(pts[1].x, pts[1].y); ctx.stroke();
    ctx.setLineDash([]);
    const dx = pts[1].x - pts[0].x, dy = pts[1].y - pts[0].y;
    const angle = Math.atan2(dy, dx);
    const aLen = 10;
    ctx.fillStyle = pm ? '#333' : '#aaa';
    ctx.beginPath();
    ctx.moveTo(pts[1].x, pts[1].y);
    ctx.lineTo(pts[1].x - aLen * Math.cos(angle - 0.4), pts[1].y - aLen * Math.sin(angle - 0.4));
    ctx.lineTo(pts[1].x - aLen * Math.cos(angle + 0.4), pts[1].y - aLen * Math.sin(angle + 0.4));
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  pts.forEach((p, i) => {
    const sz = 8;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y - sz);
    ctx.lineTo(p.x - sz * 0.7, p.y + sz * 0.5);
    ctx.lineTo(p.x + sz * 0.7, p.y + sz * 0.5);
    ctx.closePath();
    ctx.fillStyle = p.color;
    ctx.fill();
    ctx.strokeStyle = pm ? '#000' : '#fff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const offY = i === 0 ? -16 : 20;
    ctx.font = 'bold 12px sans-serif';
    const tw = ctx.measureText(p.label).width;
    ctx.fillStyle = pm ? 'rgba(255,255,255,0.85)' : 'rgba(26,26,46,0.85)';
    ctx.fillRect(p.x + 12, p.y + offY - 11, tw + 6, 16);
    ctx.fillStyle = p.color;
    ctx.textAlign = 'left';
    ctx.fillText(p.label, p.x + 15, p.y + offY);
  });
}
