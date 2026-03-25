import { memo } from "react";
import { getGrid, CELL, EL } from "../lib/elements.js";

export const GridCell = memo(function GridCell({ element, isHov, hasErr, hasWarn, hasOverride, flowIntensity, depthFrac, row, col, cellSize: cs }) {
  const cz = cs || CELL;
  const el = element ? EL[element] : null;
  const base = el ? el.clr : "transparent";
  const GRID = getGrid();

  let flowGlow = "";
  if (flowIntensity > 0 && el) {
    const alpha = Math.min(flowIntensity, 1);
    flowGlow = `, inset 0 0 ${8 + alpha * 12}px rgba(56,189,248,${alpha * 0.8})`;
  }
  if (depthFrac > 0 && el?.cat === "node") {
    const alpha = Math.min(depthFrac, 1);
    flowGlow = `, inset 0 0 ${10 + alpha * 14}px rgba(251,191,36,${alpha * 0.7})`;
  }

  let tip = `(${row}, ${col})`;
  if (el) {
    tip = `${el.e} ${el.lbl} @ (${row}, ${col})`;
    if (el.cat === "surface") tip += `\nCN: ${el.cn} • %Imperv: ${el.pI}`;
    if (el.cat === "surface") tip += `\nn-Imperv: ${el.nI} • n-Perv: ${el.nP}`;
    if (el.cat === "surface") tip += `\nDs-Imp: ${el.sI}" • Ds-Perv: ${el.sP}"`;
    if (el.cat === "node" && el.maxD) tip += `\nMax Depth: ${el.maxD} ft`;
    if (el.cat === "node") tip += `\nInvert: ${((GRID - row) * 0.5).toFixed(1)} ft`;
    if (el.cat === "link") tip += `\nDia: ${el.diam} ft • n: ${el.mann}`;
    if (el.cat === "surface") tip += `\n→ [SUBCATCHMENTS]`;
    if (element === "manhole" || element === "inlet") tip += `\n→ [JUNCTIONS]`;
    if (element === "outfall") tip += `\n→ [OUTFALLS]`;
    if (element === "pipe") tip += `\n→ [CONDUITS]`;
    if (hasOverride) tip += `\n★ Custom properties (right-click to edit)`;
    if (flowIntensity > 0) tip += `\n🌊 Flow: ${(flowIntensity * 2).toFixed(3)} CFS`;
    if (depthFrac > 0) tip += `\n💧 Depth: ${(depthFrac * (el.maxD || 6)).toFixed(2)} ft`;
  } else {
    tip += "\nEmpty — click to place\nRight-click placed cells to edit properties";
  }

  const extraShadow = flowGlow ? flowGlow : "";
  const borderStyle = hasErr ? "2px solid #D01012" : hasWarn ? "2px solid #FE8A18" : hasOverride ? "2px solid #F2C717" : isHov && !el ? "2px solid rgba(255,255,255,0.25)" : "none";
  const errShadow = hasErr ? `0 0 8px rgba(208,16,18,0.6)${extraShadow}` : hasWarn ? `0 0 8px rgba(254,138,24,0.5)${extraShadow}` : "";

  return (
    <div title={tip} className={`lego-grid-cell${el ? " filled" : ""}`} style={{
      width: cz, height: cz,
      background: el ? base : "transparent",
      border: borderStyle,
      fontSize: el ? Math.max(8, Math.round(cz * 0.4)) : 0,
      ...(errShadow ? { boxShadow: errShadow } : {}),
      ...(extraShadow && !hasErr && !hasWarn && el ? { boxShadow: `inset 4px 4px 0 0 rgba(255,255,255,0.35), inset -2px -2px 0 0 rgba(0,0,0,0.15), inset -4px -5px 0 0 rgba(0,0,0,0.25), 3px 4px 0 0 rgba(0,0,0,0.45), 3px 4px 4px 0 rgba(0,0,0,0.15)${extraShadow}` } : {}),
    }}>
      {el && <div className="stud" />}
      <span style={{ position: "relative", zIndex: 2, textShadow: el ? "1px 1px 0 rgba(0,0,0,0.5), 0 0 3px rgba(0,0,0,0.15), -1px -1px 0 rgba(255,255,255,0.10)" : "none", filter: el ? "drop-shadow(0 1px 1px rgba(0,0,0,0.25))" : "none" }}>{el ? el.e : ""}</span>
      {depthFrac > 0 && el?.cat === "node" && (
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          height: `${Math.min(depthFrac * 100, 100)}%`,
          background: "rgba(56,189,248,0.35)",
          borderRadius: "0 0 2px 2px",
          transition: "height 0.3s ease",
        }} />
      )}
    </div>
  );
});

export function PalBtn({ type, sel, onClick }) {
  const el = EL[type];
  const on = sel === type;
  return (
    <button onClick={() => onClick(type)} title={`${el.lbl}${el.cn !== undefined ? ` • CN:${el.cn} • %Imp:${el.pI}` : ""}${el.maxD ? ` • MaxD:${el.maxD}ft` : ""}${el.diam ? ` • Dia:${el.diam}ft` : ""}`}
      className={`lego-pal-btn${on ? " selected" : ""}`}
      style={{
        background: on ? el.clr : undefined,
        color: on ? "#fff" : "#A0A19B",
        fontWeight: on ? 700 : 500,
        borderBottomColor: on ? "rgba(0,0,0,0.35)" : undefined,
      }}>
      <span style={{ fontSize: 13, lineHeight: 1, position: "relative", zIndex: 2, textShadow: on ? "1px 1px 0 rgba(0,0,0,0.5), 0 0 3px rgba(0,0,0,0.15)" : "none", filter: on ? "drop-shadow(0 1px 1px rgba(0,0,0,0.3))" : "none" }}>{el.e}</span>
      <span style={{ fontSize: 7, lineHeight: 1, position: "relative", zIndex: 2, textShadow: on ? "1px 1px 0 rgba(0,0,0,0.5)" : "none", fontWeight: 800 }}>{el.lbl}</span>
    </button>
  );
}
