export const UNIT_SYSTEMS = {
  us: {
    id: "us", label: "US Customary",
    length: "ft", lengthShort: "'", area: "ac", volume: "ft³",
    flow: "CFS", velocity: "ft/s", rainfall: "in/hr",
    depth: "ft", depthSmall: "in", slope: "%",
    swmmFlowUnits: "CFS", swmmInfiltration: "CURVE_NUMBER",
  },
  si: {
    id: "si", label: "SI (Metric)",
    length: "m", lengthShort: "m", area: "ha", volume: "m³",
    flow: "CMS", velocity: "m/s", rainfall: "mm/hr",
    depth: "m", depthSmall: "mm", slope: "%",
    swmmFlowUnits: "CMS", swmmInfiltration: "CURVE_NUMBER",
  },
};

const FT_TO_M = 0.3048;
const AC_TO_HA = 0.404686;
const CFS_TO_CMS = 0.0283168;
const IN_TO_MM = 25.4;

export function convert(value, fromUnit, toUnit) {
  if (fromUnit === toUnit) return value;

  if (fromUnit === "ft" && toUnit === "m") return value * FT_TO_M;
  if (fromUnit === "m" && toUnit === "ft") return value / FT_TO_M;

  if (fromUnit === "ac" && toUnit === "ha") return value * AC_TO_HA;
  if (fromUnit === "ha" && toUnit === "ac") return value / AC_TO_HA;

  if (fromUnit === "CFS" && toUnit === "CMS") return value * CFS_TO_CMS;
  if (fromUnit === "CMS" && toUnit === "CFS") return value / CFS_TO_CMS;

  if (fromUnit === "in" && toUnit === "mm") return value * IN_TO_MM;
  if (fromUnit === "mm" && toUnit === "in") return value / IN_TO_MM;

  if (fromUnit === "in/hr" && toUnit === "mm/hr") return value * IN_TO_MM;
  if (fromUnit === "mm/hr" && toUnit === "in/hr") return value / IN_TO_MM;

  if (fromUnit === "ft/s" && toUnit === "m/s") return value * FT_TO_M;
  if (fromUnit === "m/s" && toUnit === "ft/s") return value / FT_TO_M;

  return value;
}

export function fmtVal(value, unit, decimals = 2) {
  return `${value.toFixed(decimals)} ${unit}`;
}
