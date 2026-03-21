import { LOADING_STATIONS, FUEL_DENSITY, FUEL_ARM, MAX_FUEL_LITERS, CG_ENVELOPES } from './fleet-data.js';

function isInEnvelope(mass, cg, maxTakeoffMass) {
  const envelope = CG_ENVELOPES[maxTakeoffMass];
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

export function calculate({ aircraft, stationMasses, fuelLiters }) {
  const emptyMass = aircraft.emptyWeight;
  const emptyMoment = aircraft.emptyMoment;

  const stationMoments = {};
  let stationsMassSum = 0;
  let stationsMomentSum = 0;

  for (const station of LOADING_STATIONS) {
    const mass = stationMasses[station.id] || 0;
    const moment = mass * station.arm;
    stationMoments[station.id] = moment;
    stationsMassSum += mass;
    stationsMomentSum += moment;
  }

  const stationWarnings = {};
  for (const station of LOADING_STATIONS) {
    const mass = stationMasses[station.id] || 0;
    stationWarnings[station.id] = mass > station.maxKg ? 1 : 0;
  }

  const noPilotWarning = (stationMasses.frontSeats || 0) === 0 ? 1 : 0;
  const fuelOverLimit = fuelLiters > MAX_FUEL_LITERS ? 1 : 0;

  const totalNoFuelMass = emptyMass + stationsMassSum;
  const totalNoFuelMoment = emptyMoment + stationsMomentSum;

  const fuelMass = fuelLiters * FUEL_DENSITY;
  const fuelMoment = fuelMass * FUEL_ARM;

  const totalMass = totalNoFuelMass + fuelMass;
  const totalMoment = totalNoFuelMoment + fuelMoment;

  const cgNoFuel = totalNoFuelMass > 0 ? totalNoFuelMoment / totalNoFuelMass : 0;
  const cgFull = totalMass > 0 ? totalMoment / totalMass : 0;

  const cgFullInLimits = isInEnvelope(totalMass, cgFull, aircraft.maxTakeoffMass) ? 1 : 0;
  const massInLimits = totalMass <= aircraft.maxTakeoffMass ? 1 : 0;

  return {
    emptyMass, emptyMoment, stationMoments, stationWarnings,
    noPilotWarning, fuelOverLimit,
    totalNoFuelMass, totalNoFuelMoment,
    fuelMass, fuelMoment, totalMass, totalMoment,
    cgNoFuel, cgFull, cgFullInLimits, massInLimits,
    maxTakeoffMass: aircraft.maxTakeoffMass,
  };
}

export { isInEnvelope };
