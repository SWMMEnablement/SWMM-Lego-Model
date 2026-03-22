export const POLLUTANTS = [
  { id: "TSS",  name: "TSS",  units: "MG/L", cRain: 0.0, cGW: 0.0, cRDII: 0.0, cInit: 0.0, decayCoeff: 0.0, snowOnly: "NO", coPollutant: "*", coFrac: 0.0 },
  { id: "BOD",  name: "BOD",  units: "MG/L", cRain: 0.0, cGW: 0.0, cRDII: 0.0, cInit: 0.0, decayCoeff: 0.0, snowOnly: "NO", coPollutant: "*", coFrac: 0.0 },
  { id: "COD",  name: "COD",  units: "MG/L", cRain: 0.0, cGW: 0.0, cRDII: 0.0, cInit: 0.0, decayCoeff: 0.0, snowOnly: "NO", coPollutant: "*", coFrac: 0.0 },
  { id: "TN",   name: "TN",   units: "MG/L", cRain: 0.0, cGW: 0.0, cRDII: 0.0, cInit: 0.0, decayCoeff: 0.0, snowOnly: "NO", coPollutant: "*", coFrac: 0.0 },
  { id: "TP",   name: "TP",   units: "MG/L", cRain: 0.0, cGW: 0.0, cRDII: 0.0, cInit: 0.0, decayCoeff: 0.0, snowOnly: "NO", coPollutant: "*", coFrac: 0.0 },
  { id: "Zn",   name: "Zinc", units: "UG/L", cRain: 0.0, cGW: 0.0, cRDII: 0.0, cInit: 0.0, decayCoeff: 0.0, snowOnly: "NO", coPollutant: "*", coFrac: 0.0 },
];

export const LANDUSES = {
  grass:     { id: "Residential_Lawn",   sweepInterval: 0, sweepFrac: 0, sweepRemoval: 0 },
  roof:      { id: "Rooftop",            sweepInterval: 0, sweepFrac: 0, sweepRemoval: 0 },
  road:      { id: "Road",              sweepInterval: 14, sweepFrac: 0.9, sweepRemoval: 0.5 },
  driveway:  { id: "Driveway",          sweepInterval: 0, sweepFrac: 0, sweepRemoval: 0 },
  sidewalk:  { id: "Sidewalk",          sweepInterval: 14, sweepFrac: 0.8, sweepRemoval: 0.4 },
  lid_pond:  { id: "LID_Bioretention",  sweepInterval: 0, sweepFrac: 0, sweepRemoval: 0 },
  perm_pave: { id: "Permeable_Pavement", sweepInterval: 0, sweepFrac: 0, sweepRemoval: 0 },
  grn_roof:  { id: "Green_Roof",        sweepInterval: 0, sweepFrac: 0, sweepRemoval: 0 },
  rain_brl:  { id: "Rain_Barrel",       sweepInterval: 0, sweepFrac: 0, sweepRemoval: 0 },
  swale:     { id: "Swale",             sweepInterval: 0, sweepFrac: 0, sweepRemoval: 0 },
};

export const BUILDUP = {
  Residential_Lawn:   { TSS: { func: "POW", c1: 25,  c2: 0.5, c3: 3 }, BOD: { func: "POW", c1: 5, c2: 0.4, c3: 3 }, COD: { func: "POW", c1: 15, c2: 0.5, c3: 3 }, TN: { func: "POW", c1: 2.0, c2: 0.4, c3: 5 }, TP: { func: "POW", c1: 0.5, c2: 0.3, c3: 5 }, Zn: { func: "POW", c1: 5, c2: 0.3, c3: 5 } },
  Rooftop:            { TSS: { func: "POW", c1: 10,  c2: 0.3, c3: 3 }, BOD: { func: "POW", c1: 2, c2: 0.3, c3: 3 }, COD: { func: "POW", c1: 8,  c2: 0.3, c3: 3 }, TN: { func: "POW", c1: 0.3, c2: 0.3, c3: 5 }, TP: { func: "POW", c1: 0.1, c2: 0.2, c3: 5 }, Zn: { func: "POW", c1: 50, c2: 0.4, c3: 5 } },
  Road:               { TSS: { func: "POW", c1: 50,  c2: 0.6, c3: 3 }, BOD: { func: "POW", c1: 8, c2: 0.5, c3: 3 }, COD: { func: "POW", c1: 30, c2: 0.5, c3: 3 }, TN: { func: "POW", c1: 3.0, c2: 0.5, c3: 5 }, TP: { func: "POW", c1: 0.8, c2: 0.4, c3: 5 }, Zn: { func: "POW", c1: 80, c2: 0.5, c3: 5 } },
  Driveway:           { TSS: { func: "POW", c1: 30,  c2: 0.5, c3: 3 }, BOD: { func: "POW", c1: 5, c2: 0.4, c3: 3 }, COD: { func: "POW", c1: 20, c2: 0.5, c3: 3 }, TN: { func: "POW", c1: 1.5, c2: 0.4, c3: 5 }, TP: { func: "POW", c1: 0.4, c2: 0.3, c3: 5 }, Zn: { func: "POW", c1: 40, c2: 0.4, c3: 5 } },
  Sidewalk:           { TSS: { func: "POW", c1: 20,  c2: 0.4, c3: 3 }, BOD: { func: "POW", c1: 3, c2: 0.3, c3: 3 }, COD: { func: "POW", c1: 12, c2: 0.4, c3: 3 }, TN: { func: "POW", c1: 1.0, c2: 0.3, c3: 5 }, TP: { func: "POW", c1: 0.3, c2: 0.2, c3: 5 }, Zn: { func: "POW", c1: 30, c2: 0.3, c3: 5 } },
  LID_Bioretention:   { TSS: { func: "POW", c1: 5,   c2: 0.2, c3: 5 }, BOD: { func: "POW", c1: 1, c2: 0.2, c3: 5 }, COD: { func: "POW", c1: 3,  c2: 0.2, c3: 5 }, TN: { func: "POW", c1: 0.5, c2: 0.2, c3: 7 }, TP: { func: "POW", c1: 0.1, c2: 0.1, c3: 7 }, Zn: { func: "POW", c1: 3, c2: 0.2, c3: 7 } },
  Permeable_Pavement: { TSS: { func: "POW", c1: 15,  c2: 0.3, c3: 3 }, BOD: { func: "POW", c1: 3, c2: 0.3, c3: 3 }, COD: { func: "POW", c1: 10, c2: 0.3, c3: 3 }, TN: { func: "POW", c1: 1.0, c2: 0.3, c3: 5 }, TP: { func: "POW", c1: 0.3, c2: 0.2, c3: 5 }, Zn: { func: "POW", c1: 20, c2: 0.3, c3: 5 } },
  Green_Roof:         { TSS: { func: "POW", c1: 3,   c2: 0.2, c3: 5 }, BOD: { func: "POW", c1: 1, c2: 0.2, c3: 5 }, COD: { func: "POW", c1: 2,  c2: 0.2, c3: 5 }, TN: { func: "POW", c1: 0.4, c2: 0.2, c3: 7 }, TP: { func: "POW", c1: 0.1, c2: 0.1, c3: 7 }, Zn: { func: "POW", c1: 2, c2: 0.2, c3: 7 } },
  Rain_Barrel:        { TSS: { func: "POW", c1: 5,   c2: 0.2, c3: 5 }, BOD: { func: "POW", c1: 1, c2: 0.2, c3: 5 }, COD: { func: "POW", c1: 3,  c2: 0.2, c3: 5 }, TN: { func: "POW", c1: 0.3, c2: 0.2, c3: 7 }, TP: { func: "POW", c1: 0.1, c2: 0.1, c3: 7 }, Zn: { func: "POW", c1: 3, c2: 0.2, c3: 7 } },
  Swale:              { TSS: { func: "POW", c1: 8,   c2: 0.3, c3: 5 }, BOD: { func: "POW", c1: 2, c2: 0.2, c3: 5 }, COD: { func: "POW", c1: 5,  c2: 0.3, c3: 5 }, TN: { func: "POW", c1: 0.8, c2: 0.3, c3: 7 }, TP: { func: "POW", c1: 0.2, c2: 0.2, c3: 7 }, Zn: { func: "POW", c1: 5, c2: 0.2, c3: 7 } },
};

export const WASHOFF = {
  Residential_Lawn:   { TSS: { func: "EMC", c1: 80,  c2: 0, sweepEff: 0, bmpEff: 0 }, BOD: { func: "EMC", c1: 12, c2: 0, sweepEff: 0, bmpEff: 0 }, COD: { func: "EMC", c1: 50, c2: 0, sweepEff: 0, bmpEff: 0 }, TN: { func: "EMC", c1: 2.5, c2: 0, sweepEff: 0, bmpEff: 0 }, TP: { func: "EMC", c1: 0.35, c2: 0, sweepEff: 0, bmpEff: 0 }, Zn: { func: "EMC", c1: 50, c2: 0, sweepEff: 0, bmpEff: 0 } },
  Rooftop:            { TSS: { func: "EMC", c1: 20,  c2: 0, sweepEff: 0, bmpEff: 0 }, BOD: { func: "EMC", c1: 5,  c2: 0, sweepEff: 0, bmpEff: 0 }, COD: { func: "EMC", c1: 25, c2: 0, sweepEff: 0, bmpEff: 0 }, TN: { func: "EMC", c1: 1.0, c2: 0, sweepEff: 0, bmpEff: 0 }, TP: { func: "EMC", c1: 0.10, c2: 0, sweepEff: 0, bmpEff: 0 }, Zn: { func: "EMC", c1: 200, c2: 0, sweepEff: 0, bmpEff: 0 } },
  Road:               { TSS: { func: "EMC", c1: 150, c2: 0, sweepEff: 50, bmpEff: 0 }, BOD: { func: "EMC", c1: 20, c2: 0, sweepEff: 40, bmpEff: 0 }, COD: { func: "EMC", c1: 80, c2: 0, sweepEff: 40, bmpEff: 0 }, TN: { func: "EMC", c1: 3.5, c2: 0, sweepEff: 30, bmpEff: 0 }, TP: { func: "EMC", c1: 0.60, c2: 0, sweepEff: 30, bmpEff: 0 }, Zn: { func: "EMC", c1: 300, c2: 0, sweepEff: 50, bmpEff: 0 } },
  Driveway:           { TSS: { func: "EMC", c1: 100, c2: 0, sweepEff: 0, bmpEff: 0 }, BOD: { func: "EMC", c1: 15, c2: 0, sweepEff: 0, bmpEff: 0 }, COD: { func: "EMC", c1: 60, c2: 0, sweepEff: 0, bmpEff: 0 }, TN: { func: "EMC", c1: 2.0, c2: 0, sweepEff: 0, bmpEff: 0 }, TP: { func: "EMC", c1: 0.40, c2: 0, sweepEff: 0, bmpEff: 0 }, Zn: { func: "EMC", c1: 150, c2: 0, sweepEff: 0, bmpEff: 0 } },
  Sidewalk:           { TSS: { func: "EMC", c1: 60,  c2: 0, sweepEff: 40, bmpEff: 0 }, BOD: { func: "EMC", c1: 8,  c2: 0, sweepEff: 30, bmpEff: 0 }, COD: { func: "EMC", c1: 35, c2: 0, sweepEff: 30, bmpEff: 0 }, TN: { func: "EMC", c1: 1.5, c2: 0, sweepEff: 20, bmpEff: 0 }, TP: { func: "EMC", c1: 0.25, c2: 0, sweepEff: 20, bmpEff: 0 }, Zn: { func: "EMC", c1: 80, c2: 0, sweepEff: 40, bmpEff: 0 } },
  LID_Bioretention:   { TSS: { func: "EMC", c1: 15,  c2: 0, sweepEff: 0, bmpEff: 70 }, BOD: { func: "EMC", c1: 3, c2: 0, sweepEff: 0, bmpEff: 60 }, COD: { func: "EMC", c1: 10, c2: 0, sweepEff: 0, bmpEff: 60 }, TN: { func: "EMC", c1: 0.8, c2: 0, sweepEff: 0, bmpEff: 50 }, TP: { func: "EMC", c1: 0.08, c2: 0, sweepEff: 0, bmpEff: 60 }, Zn: { func: "EMC", c1: 20, c2: 0, sweepEff: 0, bmpEff: 70 } },
  Permeable_Pavement: { TSS: { func: "EMC", c1: 40,  c2: 0, sweepEff: 0, bmpEff: 50 }, BOD: { func: "EMC", c1: 8, c2: 0, sweepEff: 0, bmpEff: 40 }, COD: { func: "EMC", c1: 30, c2: 0, sweepEff: 0, bmpEff: 40 }, TN: { func: "EMC", c1: 1.5, c2: 0, sweepEff: 0, bmpEff: 30 }, TP: { func: "EMC", c1: 0.20, c2: 0, sweepEff: 0, bmpEff: 40 }, Zn: { func: "EMC", c1: 60, c2: 0, sweepEff: 0, bmpEff: 50 } },
  Green_Roof:         { TSS: { func: "EMC", c1: 10,  c2: 0, sweepEff: 0, bmpEff: 75 }, BOD: { func: "EMC", c1: 2, c2: 0, sweepEff: 0, bmpEff: 65 }, COD: { func: "EMC", c1: 8,  c2: 0, sweepEff: 0, bmpEff: 65 }, TN: { func: "EMC", c1: 0.6, c2: 0, sweepEff: 0, bmpEff: 55 }, TP: { func: "EMC", c1: 0.05, c2: 0, sweepEff: 0, bmpEff: 65 }, Zn: { func: "EMC", c1: 15, c2: 0, sweepEff: 0, bmpEff: 75 } },
  Rain_Barrel:        { TSS: { func: "EMC", c1: 15,  c2: 0, sweepEff: 0, bmpEff: 60 }, BOD: { func: "EMC", c1: 3, c2: 0, sweepEff: 0, bmpEff: 50 }, COD: { func: "EMC", c1: 12, c2: 0, sweepEff: 0, bmpEff: 50 }, TN: { func: "EMC", c1: 0.7, c2: 0, sweepEff: 0, bmpEff: 40 }, TP: { func: "EMC", c1: 0.08, c2: 0, sweepEff: 0, bmpEff: 50 }, Zn: { func: "EMC", c1: 20, c2: 0, sweepEff: 0, bmpEff: 60 } },
  Swale:              { TSS: { func: "EMC", c1: 30,  c2: 0, sweepEff: 0, bmpEff: 55 }, BOD: { func: "EMC", c1: 5, c2: 0, sweepEff: 0, bmpEff: 45 }, COD: { func: "EMC", c1: 20, c2: 0, sweepEff: 0, bmpEff: 45 }, TN: { func: "EMC", c1: 1.2, c2: 0, sweepEff: 0, bmpEff: 35 }, TP: { func: "EMC", c1: 0.15, c2: 0, sweepEff: 0, bmpEff: 50 }, Zn: { func: "EMC", c1: 35, c2: 0, sweepEff: 0, bmpEff: 55 } },
};

export const DEFAULT_WQ_CONFIG = {
  enabled: false,
  selectedPollutants: ["TSS"],
  evapRate: 0.1,
  temperature: 70,
};
