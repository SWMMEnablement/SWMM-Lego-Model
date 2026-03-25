import { useState } from "react";
import { DEMOS } from "../lib/demos.js";

export default function Tutorial({ onClose }) {
  const [tutStep, setTutStep] = useState(0);

  const steps = [
    { title: "🧱 Welcome to SWMM5 Lego Builder!", sub: "Build stormwater networks like LEGO — drag, drop, simulate!", icon: "🌧️",
      body: "This is a browser-based SWMM5 model editor with a full JavaScript hydraulic engine. You can paint surfaces, place pipes and nodes, then run real-time simulations — all without installing EPA SWMM5.",
      visual: [
        { e: "🌱", l: "Grass", c: "#70C442" }, { e: "🏠", l: "Roof", c: "#FE8A18" }, { e: "🛣️", l: "Road", c: "#6C6E68" },
        { e: "🔵", l: "Manhole", c: "#F2C717" }, { e: "🟫", l: "Pipe", c: "#5A93DB" }, { e: "🔴", l: "Outfall", c: "#D01012" },
      ]},
    { title: "🎨 Step 1: Paint Your Catchment", sub: "Select elements from the palette and paint on the grid", icon: "🖌️",
      body: "LEFT PANEL: Click any element to select it. GRID: Click or drag to paint. Each surface type has real SWMM5 properties — Curve Number, Manning's n, depression storage. Grass (CN=39) absorbs rain; roads (CN=98) shed it immediately.",
      tips: ["🌱 Grass: CN=39, lots of infiltration", "🏠 Roof: CN=98, 85% impervious", "🛣️ Road: CN=98, 95% impervious", "🌿 LID Pond: CN=65, bioretention", "🔲 Right-click or 🧹 Eraser to remove cells"] },
    { title: "🔧 Step 2: Build the Pipe Network", sub: "Connect nodes with pipes to route collected water", icon: "🔗",
      body: "Place manholes and inlets to collect surface runoff. Connect them with pipe cells. Water flows downhill — invert elevations are automatically computed from grid row (0.5 ft per row). The outfall is the discharge point where water exits the system.",
      tips: ["⬇️ Inlet: Collects surface runoff (4 ft deep)", "🔵 Manhole: Junction point (6 ft deep)", "🔴 Outfall: Discharge boundary (FREE)", "🟫 Pipe: 18\" diameter, Manning's n=0.013", "⬇️ Water flows from top to bottom (higher inverts → lower)"] },
    { title: "✅ Step 3: Validate & Fix", sub: "Check your model for errors before running", icon: "🛡️",
      body: "Click ✅ Validate to check model integrity. Common errors: no outfall, disconnected pipes. Click 🔧 Fix to auto-repair — it will add missing outfalls and connect orphaned elements. Error cells flash red on the grid.",
      tips: ["✅ Validates: outfall exists, pipes connected, surfaces drain", "🔧 Auto-fix: adds outfalls, connects pipes", "❌ Red border = error cell", "⚠️ Warnings don't block simulation"] },
    { title: "🚀 Step 4: Run a Simulation!", sub: "Watch your network handle a design storm in real-time", icon: "⚡",
      body: "Click 🚀 Quick Sim for an animated preview — it uses simplified SCS Curve Number infiltration and Manning's equations (not full SWMM). For real EPA SWMM5 results, use 🔬 EPA SWMM5 which runs the actual solver via WebAssembly.",
      tips: ["🌧️ 49 design storms from 6 continents", "📊 Real-time hydrograph charts", "🔍 Click any cell for SWMM Inspector panel", "⏸️ Pause/resume animation anytime", "📈 System, subcatchment, pipe & node result tabs"] },
    { title: "📦 Step 5: Export & Import", sub: "Take your model into EPA SWMM5 or bring one in", icon: "💾",
      body: "📦 Export .inp generates a complete SWMM5 input file — runs directly in EPA SWMM5. 📂 Import .inp reads any standard SWMM5 file and maps it onto the grid. Load demos like Residential, Highway, Stadium, or School Campus to explore pre-built networks.",
      tips: ["📦 Export: All SWMM5 sections ([JUNCTIONS], [CONDUITS], etc.)", "📂 Import: Reads coordinates, maps to 20×20 grid", `🎲 ${DEMOS.length} demo models ready to explore`, "🌧️ Selected storm exports with the model"] },
  ];
  const step = steps[tutStep];
  const isLast = tutStep === steps.length - 1;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        width: "min(680px, 90vw)", background: "#F4F4F4",
        borderRadius: 4, border: "4px solid #F2C717", padding: 0, overflow: "hidden",
        boxShadow: "6px 6px 0 rgba(0,0,0,0.5), inset 0 0 0 2px rgba(255,255,255,0.8)",
        color: "#1B2A34",
      }}>
        <div style={{ height: 6, background: "#E4CD9E" }}>
          <div style={{
            height: "100%", borderRadius: 0, transition: "width 0.4s ease",
            width: `${((tutStep + 1) / steps.length) * 100}%`,
            background: "#D01012",
          }} />
        </div>

        <div style={{ padding: "28px 32px 24px" }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
            {steps.map((_, i) => (
              <div key={i} onClick={() => setTutStep(i)} style={{
                width: i === tutStep ? 32 : 12, height: 12, borderRadius: 3, cursor: "pointer",
                background: i === tutStep ? "#D01012" : i < tutStep ? "#4B9F4A" : "#E4CD9E",
                transition: "all 0.3s ease",
                boxShadow: "inset 1px 1px 0 rgba(255,255,255,0.3), 1px 1px 0 rgba(0,0,0,0.2)",
              }} />
            ))}
          </div>

          <div style={{ fontSize: 48, marginBottom: 8 }}>{step.icon}</div>
          <h2 style={{ fontSize: 24, fontWeight: 900, margin: "0 0 4px", color: "#D01012", fontFamily: "'Fredoka'", textShadow: "2px 2px 0 rgba(0,0,0,0.1)" }}>{step.title}</h2>
          <p style={{ fontSize: 14, color: "#6C6E68", margin: "0 0 16px", fontStyle: "italic", fontWeight: 600 }}>{step.sub}</p>

          <p style={{ fontSize: 13, color: "#1B2A34", lineHeight: 1.7, margin: "0 0 16px" }}>{step.body}</p>

          {step.visual && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
              {step.visual.map((v, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "6px 12px",
                  background: "#fff", borderRadius: 4,
                  border: "2px solid #E4CD9E",
                  boxShadow: "2px 2px 0 rgba(0,0,0,0.15)",
                }}>
                  <span style={{ fontSize: 20 }}>{v.e}</span>
                  <span style={{ fontSize: 11, color: "#1B2A34", fontWeight: 800 }}>{v.l}</span>
                </div>
              ))}
            </div>
          )}

          {step.tips && (
            <div style={{ background: "#fff", borderRadius: 4, padding: 12, marginBottom: 16, border: "2px solid #E4CD9E" }}>
              {step.tips.map((tip, i) => (
                <div key={i} style={{ fontSize: 11, color: "#1B2A34", padding: "4px 0", lineHeight: 1.5, fontWeight: 600 }}>{tip}</div>
              ))}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
            <button onClick={onClose} style={{
              padding: "8px 16px", borderRadius: 4, border: "none",
              background: "#6C6E68", color: "#F4F4F4", cursor: "pointer",
              fontSize: 12, fontFamily: "'Fredoka'", fontWeight: 800,
              boxShadow: "inset 2px 2px 0 rgba(255,255,255,0.15), inset -2px -3px 0 rgba(0,0,0,0.20), 0 3px 0 rgba(0,0,0,0.35)",
            }}>Skip Tutorial</button>
            <div style={{ display: "flex", gap: 8 }}>
              {tutStep > 0 && (
                <button onClick={() => setTutStep(s => s - 1)} style={{
                  padding: "8px 20px", borderRadius: 4, border: "none",
                  background: "#9BA19D", color: "#F4F4F4", cursor: "pointer",
                  fontSize: 12, fontFamily: "'Fredoka'", fontWeight: 800,
                  boxShadow: "inset 2px 2px 0 rgba(255,255,255,0.15), inset -2px -3px 0 rgba(0,0,0,0.20), 0 3px 0 rgba(0,0,0,0.35)",
                }}>← Back</button>
              )}
              <button onClick={() => {
                if (isLast) onClose();
                else setTutStep(s => s + 1);
              }} style={{
                padding: "8px 24px", borderRadius: 4, border: "none",
                background: isLast ? "#4B9F4A" : "#D01012",
                color: "#F4F4F4", cursor: "pointer",
                fontSize: 13, fontFamily: "'Fredoka'", fontWeight: 900,
                boxShadow: "inset 2px 2px 0 rgba(255,255,255,0.25), inset -2px -3px 0 rgba(0,0,0,0.20), 0 4px 0 rgba(0,0,0,0.35)",
              }}>{isLast ? "🚀 Start Building!" : `Next → (${tutStep + 1}/${steps.length})`}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
