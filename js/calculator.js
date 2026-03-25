/**
 * Weight & Balance calculator — type-agnostic.
 * All type-specific data (stations, fuel, envelopes) is passed in via parameters.
 */

function isInEnvelope(mass, cg, cgEnvelopes, maxTakeoffMass) {
  const envelope = cgEnvelopes[maxTakeoffMass];
  if (!envelope) return false;

  const minMass = envelope[0].mass;
  const maxMass = envelope[envelope.length - 1].mass;

  if (mass < minMass || mass > maxMass) return false;

  let cgFwd, cgAft;
  for (let i = 0; i < envelope.length - 1; i++) {
    const a = envelope[i];
    const b = envelope[i + 1];
    if (mass >= a.mass && mass <= b.mass) {
      const t = (mass - a.mass) / (b.mass - a.mass);
      cgFwd = a.cgFwd + t * (b.cgFwd - a.cgFwd);
      cgAft = a.cgAft + t * (b.cgAft - a.cgAft);
      break;
    }
  }

  if (cgFwd === undefined) return false;
  return cg >= cgFwd && cg <= cgAft;
}

/**
 * @param {object} opts
 * @param {object} opts.aircraft       — selected fleet entry
 * @param {object} opts.typeConfig     — full type config from AIRCRAFT_TYPES
 * @param {object} opts.stationMasses  — { stationId: kg }
 * @param {object} opts.fuelLiters     — { fuelSystemId: liters }
 * @param {object} opts.fuelMaxLiters  — { fuelSystemId: maxLiters } (after tank config overrides)
 */
export function calculate({ aircraft, typeConfig, stationMasses, fuelLiters, fuelMaxLiters }) {
  const emptyMass = aircraft.emptyWeight;
  const emptyMoment = aircraft.emptyMoment;

  // Stations
  const stationMoments = {};
  let stationsMassSum = 0;
  let stationsMomentSum = 0;

  for (const station of typeConfig.loadingStations) {
    const mass = stationMasses[station.id] || 0;
    const moment = mass * station.arm;
    stationMoments[station.id] = moment;
    stationsMassSum += mass;
    stationsMomentSum += moment;
  }

  const stationWarnings = {};
  for (const station of typeConfig.loadingStations) {
    const mass = stationMasses[station.id] || 0;
    stationWarnings[station.id] = mass > station.maxKg ? 1 : 0;
  }

  // Pilot warning — check first "seats" station
  const firstStation = typeConfig.loadingStations[0];
  const noPilotWarning = (stationMasses[firstStation.id] || 0) === 0 ? 1 : 0;

  // Total without fuel
  const totalNoFuelMass = emptyMass + stationsMassSum;
  const totalNoFuelMoment = emptyMoment + stationsMomentSum;

  // Fuel — sum all fuel systems
  let totalFuelMass = 0;
  let totalFuelMoment = 0;
  const fuelDetails = {};
  const fuelOverLimits = {};
  let anyFuelOverLimit = false;

  for (const fs of typeConfig.fuelSystems) {
    const liters = fuelLiters[fs.id] || 0;
    const maxL = fuelMaxLiters[fs.id] || fs.maxLiters;
    const mass = liters * fs.density;
    const moment = mass * fs.arm;
    fuelDetails[fs.id] = { liters, mass, moment, maxLiters: maxL };
    totalFuelMass += mass;
    totalFuelMoment += moment;
    const over = liters > maxL ? 1 : 0;
    fuelOverLimits[fs.id] = over;
    if (over) anyFuelOverLimit = true;
  }

  // Totals
  const totalMass = totalNoFuelMass + totalFuelMass;
  const totalMoment = totalNoFuelMoment + totalFuelMoment;

  const cgNoFuel = totalNoFuelMass > 0 ? totalNoFuelMoment / totalNoFuelMass : 0;
  const cgFull = totalMass > 0 ? totalMoment / totalMass : 0;

  const cgFullInLimits = isInEnvelope(totalMass, cgFull, typeConfig.cgEnvelopes, aircraft.maxTakeoffMass) ? 1 : 0;
  const massInLimits = totalMass <= aircraft.maxTakeoffMass ? 1 : 0;

  return {
    emptyMass, emptyMoment, stationMoments, stationWarnings,
    noPilotWarning, fuelOverLimits, fuelOverLimit: anyFuelOverLimit ? 1 : 0,
    totalNoFuelMass, totalNoFuelMoment,
    fuelDetails, totalFuelMass, totalFuelMoment,
    totalMass, totalMoment,
    cgNoFuel, cgFull, cgFullInLimits, massInLimits,
    maxTakeoffMass: aircraft.maxTakeoffMass,
  };
}

export { isInEnvelope };
