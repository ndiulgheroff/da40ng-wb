/**
 * Multi-type Fleet Data — Urbe Flight School
 *
 * IMPORTANT: emptyWeight and emptyMoment are authoritative values from
 * the weighing report. emptyArm is for display only — never compute
 * moment as weight × arm (rounding differences exist).
 *
 * Update this file when aircraft are re-weighed or new types are added.
 */

export const AIRCRAFT_TYPES = {

  /* ─── DA40NG ──────────────────────────────────────────────────────── */
  DA40NG: {
    id: 'DA40NG',
    label: 'DA40NG',

    fuelSystems: [
      { id: 'mainFuel', density: 0.84, arm: 2.63, maxLiters: 148,
        labelIt: 'Carburante (Jet-A1)', labelEn: 'Fuel (Jet-A1)' },
    ],

    tankConfigs: {
      longRange: {
        id: 'longRange',
        fuelOverrides: { mainFuel: 148 },
        labelIt: 'Long Range Tank (148 L)', labelEn: 'Long Range Tank (148 L)',
      },
      standard: {
        id: 'standard',
        fuelOverrides: { mainFuel: 106 },
        labelIt: 'Standard Tank (106 L)', labelEn: 'Standard Tank (106 L)',
      },
    },
    defaultTankConfig: 'longRange',

    maxZeroFuelMass: 1200,

    loadingStations: [
      { id: 'frontSeats',  arm: 2.30, maxKg: 200, labelIt: 'Sedili anteriori',             labelEn: 'Front seats' },
      { id: 'rearSeats',   arm: 3.25, maxKg: 80,  labelIt: 'Sedili posteriori',            labelEn: 'Rear seats' },
      { id: 'stdBaggage',  arm: 3.65, maxKg: 18,  labelIt: 'Bagagliaio standard',          labelEn: 'Standard baggage comp.' },
      { id: 'baggageTube', arm: 4.32, maxKg: 18,  labelIt: 'Tubo bagagli',                 labelEn: 'Baggage tube' },
      { id: 'shortBagExt', arm: 3.97, maxKg: 18,  labelIt: 'Estensione bagagli corta',     labelEn: 'Short baggage extension' },
      { id: 'fwdExtBag',   arm: 3.89, maxKg: 18,  labelIt: 'Bagagliaio esteso anteriore',  labelEn: 'Fwd extended baggage comp.' },
      { id: 'aftExtBag',   arm: 4.54, maxKg: 18,  labelIt: 'Bagagliaio esteso posteriore', labelEn: 'Aft extended baggage comp.' },
    ],

    cgEnvelopes: {
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
    },

    chartScales: {
      cg:     { min: 2.38, max: 2.58, step: 0.02, labelStep: 0.02 },
      mass:   { min: 920,  max: 1330, step: 20,   labelStep: 40 },
      moment: { min: 2100, max: 3400, step: 100,  labelStep: 200 },
    },

    fleet: [
      { registration: 'OE-DDA', lastWeighing: '27/07/2024', emptyWeight: 939.65, emptyArm: 2.442, emptyMoment: 2294.800, maxTakeoffMass: 1310 },
      { registration: 'OE-DDB', lastWeighing: '11/11/2025', emptyWeight: 913.73, emptyArm: 2.432, emptyMoment: 2222.22,  maxTakeoffMass: 1280 },
      { registration: 'OE-DDC', lastWeighing: '19/07/2024', emptyWeight: 936.30, emptyArm: 2.445, emptyMoment: 2289.100, maxTakeoffMass: 1310 },
      { registration: 'OE-DDE', lastWeighing: '02/10/2025', emptyWeight: 908.55, emptyArm: 2.432, emptyMoment: 2209.94,  maxTakeoffMass: 1280 },
      { registration: 'OE-DDF', lastWeighing: '23/06/2025', emptyWeight: 932.50, emptyArm: 2.440, emptyMoment: 2279.100, maxTakeoffMass: 1310 },
      { registration: 'OE-DDH', lastWeighing: '16/05/2024', emptyWeight: 938.78, emptyArm: 2.445, emptyMoment: 2294.327, maxTakeoffMass: 1310 },
      { registration: 'OE-DDI', lastWeighing: '19/07/2024', emptyWeight: 939.12, emptyArm: 2.451, emptyMoment: 2301.500, maxTakeoffMass: 1310 },
      { registration: 'OE-DDJ', lastWeighing: '05/07/2023', emptyWeight: 935.30, emptyArm: 2.438, emptyMoment: 2280.600, maxTakeoffMass: 1310 },
      { registration: 'OE-DDL', lastWeighing: '23/06/2025', emptyWeight: 933.30, emptyArm: 2.440, emptyMoment: 2277.00,  maxTakeoffMass: 1310 },
    ],
  },

  /* ─── DA42NG ──────────────────────────────────────────────────────── */
  DA42NG: {
    id: 'DA42NG',
    label: 'DA42NG',

    fuelSystems: [
      { id: 'mainFuel', density: 0.84, arm: 2.63, maxLiters: 189,
        labelIt: 'Carburante principale (Jet-A1)', labelEn: 'Main fuel (Jet-A1)' },
      { id: 'auxFuel', density: 0.84, arm: 3.20, maxLiters: 100,
        labelIt: 'Carburante ausiliario (Jet-A1)', labelEn: 'Auxiliary fuel (Jet-A1)', optional: true },
    ],

    tankConfigs: null,
    defaultTankConfig: null,

    maxZeroFuelMass: null,

    loadingStations: [
      { id: 'frontSeats',     arm: 2.30,  maxKg: 200,  labelIt: 'Sedili anteriori',                           labelEn: 'Front seats' },
      { id: 'rearSeats',      arm: 3.25,  maxKg: 180,  labelIt: 'Sedili posteriori',                          labelEn: 'Rear seats' },
      { id: 'noseBaggage',    arm: 0.90,  maxKg: 30,   labelIt: 'Bagagliaio anteriore (muso)',                 labelEn: 'Nose baggage comp.' },
      { id: 'cabinBaggage',   arm: 3.89,  maxKg: 45,   labelIt: 'Bagagliaio cabina',                          labelEn: 'Cabin baggage comp.' },
      { id: 'baggageExt',     arm: 4.54,  maxKg: 18,   labelIt: 'Estensione bagagli',                         labelEn: 'Baggage extension' },
      { id: 'stdBaggage',     arm: 3.65,  maxKg: 30,   labelIt: 'Bagagliaio standard',                        labelEn: 'Standard baggage comp.' },
      { id: 'shortBagExt',    arm: 3.97,  maxKg: 15,   labelIt: 'Estensione bagagli corta (OAM 42-301)',       labelEn: 'Short baggage ext. (OAM 42-301)' },
      { id: 'deIcingFluid',   arm: 1.00,  maxKg: 27.5, labelIt: 'Liquido anti-ghiaccio (OAM 42-160)',         labelEn: 'De-icing fluid (OAM 42-160)', excludes: 'deIcingFluid2' },
      { id: 'deIcingFluid2',  arm: 1.52,  maxKg: 27.5, labelIt: 'Liquido anti-ghiaccio (OAM 42-160 + 42-309)',labelEn: 'De-icing fluid (OAM 42-160 + 42-309)', excludes: 'deIcingFluid' },
    ],

    // CG envelope from EASA TCDS A.005 Issue 44, Section C.III.14
    // Aft limit: 2.454 at 1450 kg, linear to 2.480 at 1700+ kg (without OAM 42-199)
    // Forward limit: 2.350 at 1450-1468 kg, linear to 2.418 at 1900, 2.434 at 1999
    cgEnvelopes: {
      1900: [
        { mass: 1450, cgFwd: 2.350, cgAft: 2.454 },
        { mass: 1468, cgFwd: 2.350, cgAft: 2.456 },
        { mass: 1700, cgFwd: 2.387, cgAft: 2.480 },
        { mass: 1900, cgFwd: 2.418, cgAft: 2.480 },
      ],
      1999: [
        { mass: 1450, cgFwd: 2.350, cgAft: 2.454 },
        { mass: 1468, cgFwd: 2.350, cgAft: 2.456 },
        { mass: 1700, cgFwd: 2.387, cgAft: 2.480 },
        { mass: 1900, cgFwd: 2.418, cgAft: 2.480 },
        { mass: 1999, cgFwd: 2.434, cgAft: 2.480 },
      ],
    },

    chartScales: {
      cg:     { min: 2.33, max: 2.52, step: 0.02, labelStep: 0.05 },
      mass:   { min: 1400, max: 2050, step: 25,   labelStep: 50 },
      moment: { min: 3300, max: 4900, step: 100,  labelStep: 200 },
    },

    fleet: [
      { registration: 'OE-FDD', lastWeighing: '24/03/2024', emptyWeight: 1462.16, emptyArm: 2.410, emptyMoment: 3522.38, maxTakeoffMass: 1900 },
      { registration: 'OE-FEE', lastWeighing: '20/08/2024', emptyWeight: 1497.68, emptyArm: 2.409, emptyMoment: 3607.59, maxTakeoffMass: 1900 },
    ],
  },

  /* ─── I-AL42 (DA42NG, separate form) ─────────────────────────────── */
  IAL42: {
    id: 'IAL42',
    label: 'I-AL42',

    fuelSystems: [
      { id: 'mainFuel', density: 0.84, arm: 2.63, maxLiters: 189,
        labelIt: 'Carburante principale (Jet-A1)', labelEn: 'Main fuel (Jet-A1)' },
      { id: 'auxFuel', density: 0.84, arm: 3.20, maxLiters: 100,
        labelIt: 'Carburante ausiliario (Jet-A1)', labelEn: 'Auxiliary fuel (Jet-A1)', optional: true },
    ],

    tankConfigs: null,
    defaultTankConfig: null,

    maxZeroFuelMass: null,

    loadingStations: [
      { id: 'frontSeats',     arm: 2.30,  maxKg: 200,  labelIt: 'Sedili anteriori',                           labelEn: 'Front seats' },
      { id: 'rearSeats',      arm: 3.25,  maxKg: 180,  labelIt: 'Sedili posteriori',                          labelEn: 'Rear seats' },
      { id: 'noseBaggage',    arm: 0.90,  maxKg: 30,   labelIt: 'Bagagliaio anteriore (muso)',                 labelEn: 'Nose baggage comp.' },
      { id: 'cabinBaggage',   arm: 3.89,  maxKg: 45,   labelIt: 'Bagagliaio cabina',                          labelEn: 'Cabin baggage comp.' },
      { id: 'baggageExt',     arm: 4.54,  maxKg: 18,   labelIt: 'Estensione bagagli',                         labelEn: 'Baggage extension' },
      { id: 'stdBaggage',     arm: 3.65,  maxKg: 30,   labelIt: 'Bagagliaio standard',                        labelEn: 'Standard baggage comp.' },
      { id: 'shortBagExt',    arm: 3.97,  maxKg: 15,   labelIt: 'Estensione bagagli corta (OAM 42-301)',       labelEn: 'Short baggage ext. (OAM 42-301)' },
      { id: 'deIcingFluid',   arm: 1.00,  maxKg: 27.5, labelIt: 'Liquido anti-ghiaccio (OAM 42-160)',         labelEn: 'De-icing fluid (OAM 42-160)', excludes: 'deIcingFluid2' },
      { id: 'deIcingFluid2',  arm: 1.52,  maxKg: 27.5, labelIt: 'Liquido anti-ghiaccio (OAM 42-160 + 42-309)',labelEn: 'De-icing fluid (OAM 42-160 + 42-309)', excludes: 'deIcingFluid' },
    ],

    // CG envelope from EASA TCDS A.005 Issue 44, Section C.III.14
    cgEnvelopes: {
      1900: [
        { mass: 1450, cgFwd: 2.350, cgAft: 2.454 },
        { mass: 1468, cgFwd: 2.350, cgAft: 2.456 },
        { mass: 1700, cgFwd: 2.387, cgAft: 2.480 },
        { mass: 1900, cgFwd: 2.418, cgAft: 2.480 },
      ],
      1999: [
        { mass: 1450, cgFwd: 2.350, cgAft: 2.454 },
        { mass: 1468, cgFwd: 2.350, cgAft: 2.456 },
        { mass: 1700, cgFwd: 2.387, cgAft: 2.480 },
        { mass: 1900, cgFwd: 2.418, cgAft: 2.480 },
        { mass: 1999, cgFwd: 2.434, cgAft: 2.480 },
      ],
    },

    chartScales: {
      cg:     { min: 2.33, max: 2.52, step: 0.02, labelStep: 0.05 },
      mass:   { min: 1400, max: 2050, step: 25,   labelStep: 50 },
      moment: { min: 3300, max: 4900, step: 100,  labelStep: 200 },
    },

    fleet: [
      { registration: 'I-AL42', lastWeighing: '24/03/2024', emptyWeight: 1462.16, emptyArm: 2.410, emptyMoment: 3522.38, maxTakeoffMass: 1900 },
    ],
  },

  /* ─── DA20-C1 ─────────────────────────────────────────────────────── */
  DA20C1: {
    id: 'DA20C1',
    label: 'DA20-C1',

    fuelSystems: [
      { id: 'mainFuel', density: 0.72, arm: 0.824, maxLiters: 91,
        labelIt: 'Carburante (AVGAS)', labelEn: 'Fuel (AVGAS)' },
    ],

    tankConfigs: {
      standard91: {
        id: 'standard91',
        fuelOverrides: { mainFuel: 91 },
        labelIt: 'Serbatoio standard S/N C0014+ (91 L)', labelEn: 'Standard tank S/N C0014+ (91 L)',
      },
      original80: {
        id: 'original80',
        fuelOverrides: { mainFuel: 80 },
        labelIt: 'Serbatoio originale S/N C0001-C0013 (80 L)', labelEn: 'Original tank S/N C0001-C0013 (80 L)',
      },
      alternate76: {
        id: 'alternate76',
        fuelOverrides: { mainFuel: 76 },
        labelIt: 'Serbatoio alternativo Dwg 22-2813 (76 L)', labelEn: 'Alternate tank Dwg 22-2813 (76 L)',
      },
    },
    defaultTankConfig: 'standard91',

    maxZeroFuelMass: null,

    loadingStations: [
      { id: 'pilotAndPax',   arm: 0.143, maxKg: 200, labelIt: 'Pilota e passeggero',                    labelEn: 'Pilot and passenger' },
      { id: 'baggage',       arm: 0.824, maxKg: 20,  labelIt: 'Bagagliaio',                             labelEn: 'Baggage' },
      { id: 'baggageExt',    arm: 1.575, maxKg: 20,  labelIt: 'Estensione bagagliaio',     labelEn: 'Baggage comp. extension', onlyFor: ['OE-CCB'] },
    ],

    // CG envelope from AFM Rev 23, Section 2.8 (DA202-C1)
    // Datum: tangent to leading edge of wing at root rib
    // Forward CG: 0.202 m (7.96 in) — constant all weights
    // Aft CG: 0.317 m (12.49 in) — constant up to 750 kg
    cgEnvelopes: {
      750: [
        { mass: 450, cgFwd: 0.202, cgAft: 0.317 },
        { mass: 750, cgFwd: 0.202, cgAft: 0.317 },
      ],
    },

    chartScales: {
      cg:     { min: 0.10, max: 0.40,  step: 0.05, labelStep: 0.05 },
      mass:   { min: 420,  max: 800,   step: 20,   labelStep: 40 },
      moment: { min: 80,   max: 260,   step: 20,   labelStep: 40 },
    },

    fleet: [
      { registration: 'OE-CCB', lastWeighing: '19/11/2025', emptyWeight: 559.48,  emptyArm: 0.226,  emptyMoment: 126.25,  maxTakeoffMass: 750 },
      { registration: 'OE-CCE', lastWeighing: '11/04/2025', emptyWeight: 566.74,  emptyArm: 0.191,  emptyMoment: 108.55,  maxTakeoffMass: 750 },
      { registration: 'OE-CCJ', lastWeighing: '20/11/2025', emptyWeight: 556.84,  emptyArm: 0.192,  emptyMoment: 106.91,  maxTakeoffMass: 750 },
      { registration: 'OE-CCK', lastWeighing: '08/10/2020', emptyWeight: 551.040, emptyArm: 0.212,  emptyMoment: 116.790, maxTakeoffMass: 750 },
      { registration: 'OE-CCO', lastWeighing: '20/11/2025', emptyWeight: 568.74,  emptyArm: 0.1886, emptyMoment: 107.266, maxTakeoffMass: 750 },
      { registration: 'OE-CCL', lastWeighing: '19/12/2025', emptyWeight: 563.30,  emptyArm: 0.189,  emptyMoment: 106.40,  maxTakeoffMass: 750 },
      { registration: 'OE-CCD', lastWeighing: '05/12/2025', emptyWeight: 557.54,  emptyArm: 0.203,  emptyMoment: 113.45,  maxTakeoffMass: 750 },
    ],
  },
};

/** Helper: get sorted type IDs */
export const TYPE_IDS = Object.keys(AIRCRAFT_TYPES);
