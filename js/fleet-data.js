/**
 * DA40NG Fleet Data — Urbe Flight School
 * Source: DA40NG M&B form Ed. 0 Rev.15 (18/12/2025)
 *
 * IMPORTANT: emptyWeight and emptyMoment are authoritative values from
 * the weighing report. emptyArm is for display only — never compute
 * moment as weight × arm (rounding differences exist).
 *
 * Update this file when aircraft are re-weighed.
 */

export const FUEL_DENSITY = 0.84; // kg per liter (Jet-A1)
export const FUEL_ARM = 2.63; // meters aft of DP
export const MAX_FUEL_LITERS = 148;

export const LOADING_STATIONS = [
  { id: 'frontSeats',    arm: 2.30, maxKg: 200, labelIt: 'Sedili anteriori',               labelEn: 'Front seats' },
  { id: 'rearSeats',     arm: 3.25, maxKg: 80,  labelIt: 'Sedili posteriori',              labelEn: 'Rear seats' },
  { id: 'stdBaggage',    arm: 3.65, maxKg: 18,  labelIt: 'Bagagliaio standard',            labelEn: 'Standard baggage comp.' },
  { id: 'baggageTube',   arm: 4.32, maxKg: 18,  labelIt: 'Tubo bagagli',                   labelEn: 'Baggage tube' },
  { id: 'shortBagExt',   arm: 3.97, maxKg: 18,  labelIt: 'Estensione bagagli corta',       labelEn: 'Short baggage extension' },
  { id: 'fwdExtBag',     arm: 3.89, maxKg: 18,  labelIt: 'Bagagliaio esteso anteriore',    labelEn: 'Fwd extended baggage comp.' },
  { id: 'aftExtBag',     arm: 4.54, maxKg: 18,  labelIt: 'Bagagliaio esteso posteriore',   labelEn: 'Aft extended baggage comp.' },
];

export const CG_ENVELOPES = {
  1310: [
    { mass: 938,  cgFwd: 2.40,  cgAft: 2.531 },
    { mass: 1078, cgFwd: 2.40,  cgAft: 2.531 },
    { mass: 1310, cgFwd: 2.467, cgAft: 2.531 },
  ],
  1280: [
    { mass: 940,  cgFwd: 2.40, cgAft: 2.53 },
    { mass: 1080, cgFwd: 2.40, cgAft: 2.53 },
    { mass: 1280, cgFwd: 2.46, cgAft: 2.53 },
  ],
};

export const FLEET = [
  { registration: 'OE-DDA', lastWeighing: '27/07/2024', emptyWeight: 939.65, emptyArm: 2.442, emptyMoment: 2294.800, maxTakeoffMass: 1310 },
  { registration: 'OE-DDB', lastWeighing: '11/11/2025', emptyWeight: 913.73, emptyArm: 2.432, emptyMoment: 2222.22,  maxTakeoffMass: 1280 },
  { registration: 'OE-DDC', lastWeighing: '19/07/2024', emptyWeight: 936.30, emptyArm: 2.445, emptyMoment: 2289.100, maxTakeoffMass: 1310 },
  { registration: 'OE-DDE', lastWeighing: '02/10/2025', emptyWeight: 908.55, emptyArm: 2.432, emptyMoment: 2209.94,  maxTakeoffMass: 1280 },
  { registration: 'OE-DDF', lastWeighing: '23/06/2025', emptyWeight: 932.50, emptyArm: 2.440, emptyMoment: 2279.100, maxTakeoffMass: 1310 },
  { registration: 'OE-DDH', lastWeighing: '16/05/2024', emptyWeight: 938.78, emptyArm: 2.445, emptyMoment: 2294.327, maxTakeoffMass: 1310 },
  { registration: 'OE-DDI', lastWeighing: '19/07/2024', emptyWeight: 939.12, emptyArm: 2.451, emptyMoment: 2301.500, maxTakeoffMass: 1310 },
  { registration: 'OE-DDJ', lastWeighing: '05/07/2023', emptyWeight: 935.30, emptyArm: 2.438, emptyMoment: 2280.600, maxTakeoffMass: 1310 },
  { registration: 'OE-DDL', lastWeighing: '23/06/2025', emptyWeight: 933.30, emptyArm: 2.440, emptyMoment: 2277.00,  maxTakeoffMass: 1310 },
];
