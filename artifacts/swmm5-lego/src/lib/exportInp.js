import { getGrid, SPC, EL } from './elements.js';
import { buildModel } from './hydraulics.js';
import { POLLUTANTS, LANDUSES, BUILDUP, WASHOFF } from './pollutants.js';

export function exportINP(grid, storm, cellProps, options = {}) {
  const GRID = getGrid();
  const model = buildModel(grid, cellProps);
  const totalMin = (storm.rain.length * storm.dtRain) / 60;
  const endHr = Math.ceil(totalMin / 60);
  const cellSpc = options.cellSpacing || SPC;
  const spcRatio = cellSpc / SPC;
  const unitSys = options.unitSystem || "us";
  const flowUnits = unitSys === "si" ? "CMS" : "CFS";
  let inp = "";
  const ln = (s="") => { inp += s + "\n"; };

  const wq = options.waterQuality || { enabled: false, selectedPollutants: ["TSS"] };
  const isContinuous = storm.continuous === true;
  const simDays = isContinuous ? (storm.durationDays || 1) : 0;
  const evapRate = options.evapRate !== undefined ? options.evapRate : 0.1;

  let startDate = "01/01/2025";
  let endDate = "01/01/2025";
  let endTime = `${String(endHr).padStart(2,'0')}:00:00`;

  if (isContinuous && simDays > 1) {
    const sd = new Date(2025, 0, 1);
    const ed = new Date(sd);
    ed.setDate(ed.getDate() + simDays);
    endDate = `${String(ed.getMonth()+1).padStart(2,'0')}/${String(ed.getDate()).padStart(2,'0')}/${ed.getFullYear()}`;
    endTime = "00:00:00";
  }

  ln("[TITLE]"); ln(";;SWMM5 Lego Builder Export"); ln(`;;${new Date().toISOString()}`);
  if (wq.enabled) ln(";;Water Quality: " + wq.selectedPollutants.join(", "));
  if (isContinuous) ln(`;;Continuous Simulation: ${simDays} days`);
  ln();

  ln("[OPTIONS]");
  ln(`FLOW_UNITS           ${flowUnits}`); ln("INFILTRATION         CURVE_NUMBER"); ln("FLOW_ROUTING         DYNWAVE");
  ln("LINK_OFFSETS          DEPTH"); ln("ALLOW_PONDING        YES");
  ln(`START_DATE           ${startDate}`); ln("START_TIME           00:00:00");
  ln(`END_DATE             ${endDate}`); ln(`END_TIME             ${endTime}`);
  if (isContinuous) {
    ln("REPORT_STEP          00:15:00"); ln("WET_STEP             00:05:00"); ln("DRY_STEP             01:00:00");
  } else {
    ln("REPORT_STEP          00:05:00"); ln("WET_STEP             00:01:00"); ln("DRY_STEP             01:00:00");
  }
  ln("ROUTING_STEP         0:00:15"); ln("VARIABLE_STEP        0.75"); ln(); 

  if (isContinuous) {
    ln("[EVAPORATION]");
    ln(`CONSTANT     ${evapRate.toFixed(3)}`);
    ln("DRY_ONLY     NO");
    ln();

    ln("[TEMPERATURE]");
    ln("WINDSPEED MONTHLY");
    ln(";;          Jan  Feb  Mar  Apr  May  Jun  Jul  Aug  Sep  Oct  Nov  Dec");
    ln("WINDSPEED   10   10   10   10   8    6    6    6    8    10   10   10");
    ln("SNOWMELT    34   1.0  0.5  0.6  0.06 0.0  0    0");
    ln("ADC IMPERVIOUS");
    ln("             1.0  1.0  1.0  1.0  1.0  1.0  1.0  1.0  1.0  1.0");
    ln("ADC PERVIOUS");
    ln("             1.0  1.0  1.0  1.0  1.0  1.0  1.0  1.0  1.0  1.0");
    ln();
  }

  const rainIntvMin = Math.round(storm.dtRain / 60);
  const rainHH = Math.floor(rainIntvMin / 60);
  const rainMM = rainIntvMin % 60;
  const rainIntvStr = `${rainHH}:${String(rainMM).padStart(2,'0')}`;
  ln("[RAINGAGES]"); ln(`RG1              INTENSITY ${rainIntvStr}     1.0      TIMESERIES TS_Rain`); ln();

  ln("[SUBCATCHMENTS]");
  ln(";;Name           Rain Gage        Outlet           Area     %Imperv  Width    %Slope   CurbLen  SnowPack");
  model.subcatchments.forEach(sc => {
    const scaledArea = sc.area_ac * spcRatio * spcRatio;
    const scaledWidth = sc.width * spcRatio;
    ln(`${sc.id.padEnd(17)}RG1              ${sc.outlet.id.padEnd(17)}${scaledArea.toFixed(2).padStart(8)} ${sc.pctImperv.toFixed(0).padStart(8)} ${scaledWidth.toFixed(0).padStart(8)} ${sc.slope.toFixed(1).padStart(8)} ${"0".padStart(8)}`);
  }); ln();

  ln("[SUBAREAS]");
  ln(";;Subcatchment   N-Imperv   N-Perv     S-Imperv   S-Perv     PctZero    RouteTo");
  model.subcatchments.forEach(sc => {
    ln(`${sc.id.padEnd(17)}${sc.nImperv.toFixed(3).padStart(10)} ${sc.nPerv.toFixed(3).padStart(10)} ${sc.dsImperv.toFixed(2).padStart(10)} ${sc.dsPerv.toFixed(2).padStart(10)} ${("25").padStart(10)} OUTLET`);
  }); ln();

  ln("[INFILTRATION]");
  model.subcatchments.forEach(sc => { ln(`${sc.id.padEnd(17)}${sc.cn.toFixed(0).padStart(10)} ${"0.5".padStart(10)} ${"7".padStart(10)}`); }); ln();

  ln("[JUNCTIONS]");
  ln(";;Name           Elevation  MaxDepth   InitDepth  SurDepth   Aponded");
  (model.junctions || model.nodes.filter(n => !n.isStorage && !n.isDivider)).forEach(n => {
    ln(`${n.id.padEnd(17)}${n.invert.toFixed(2).padStart(10)} ${(n.maxDepth||6).toString().padStart(10)} ${"0".padStart(10)} ${"0".padStart(10)} ${"0".padStart(10)}`);
  }); ln();

  ln("[OUTFALLS]");
  model.outfalls.forEach(o => { ln(`${o.id.padEnd(17)}${o.invert.toFixed(2).padStart(10)} FREE                                  NO`); }); ln();

  if (model.storage && model.storage.length > 0) {
    ln("[STORAGE]");
    ln(";;Name           Elev       MaxDepth   InitDepth  Shape      Curve Name/Params            Ponded  Evap  Seep");
    model.storage.forEach(s => {
      ln(`${s.id.padEnd(17)}${s.invert.toFixed(2).padStart(10)} ${(s.maxDepth||10).toString().padStart(10)} ${"0".padStart(10)} FUNCTIONAL 1000       0          0          ${"0".padStart(8)} ${"0".padStart(5)} ${"0".padStart(5)}`);
    }); ln();
  }

  if (model.dividers && model.dividers.length > 0) {
    ln("[DIVIDERS]");
    ln(";;Name           Elevation  Diverted Link     Type       Parameters");
    model.dividers.forEach(d => {
      ln(`${d.id.padEnd(17)}${d.invert.toFixed(2).padStart(10)} *                OVERFLOW`);
    }); ln();
  }

  ln("[CONDUITS]");
  model.conduits.forEach(cd => {
    const scaledLen = cd.length * spcRatio;
    ln(`${cd.id.padEnd(17)}${cd.from.id.padEnd(17)}${cd.to.id.padEnd(17)}${scaledLen.toFixed(0).padStart(10)} ${cd.n.toFixed(4).padStart(10)} ${"0".padStart(10)} ${"0".padStart(10)} ${"0".padStart(10)} ${"0".padStart(10)}`);
  }); ln();

  if (model.pumps && model.pumps.length > 0) {
    ln("[PUMPS]");
    ln(";;Name           From Node        To Node          Pump Curve       Status   Startup  Shutoff");
    model.pumps.forEach(p => {
      ln(`${p.id.padEnd(17)}${p.from.id.padEnd(17)}${p.to.id.padEnd(17)}*                ON       ${"0".padStart(8)} ${"0".padStart(8)}`);
    }); ln();
  }

  if (model.orifices && model.orifices.length > 0) {
    ln("[ORIFICES]");
    ln(";;Name           From Node        To Node          Type         Offset     Qcoeff     Gated    CloseTime");
    model.orifices.forEach(o => {
      ln(`${o.id.padEnd(17)}${o.from.id.padEnd(17)}${o.to.id.padEnd(17)}SIDE         ${"0".padStart(10)} ${(0.65).toFixed(4).padStart(10)} NO       ${"0".padStart(10)}`);
    }); ln();
  }

  if (model.weirs && model.weirs.length > 0) {
    ln("[WEIRS]");
    ln(";;Name           From Node        To Node          Type         CrestHt    Qcoeff     Gated    EndCon   EndCoeff   Surcharge");
    model.weirs.forEach(w => {
      ln(`${w.id.padEnd(17)}${w.from.id.padEnd(17)}${w.to.id.padEnd(17)}TRANSVERSE   ${"0".padStart(10)} ${(3.33).toFixed(2).padStart(10)} NO       ${"0".padStart(8)} ${"0".padStart(10)} YES`);
    }); ln();
  }

  ln("[XSECTIONS]");
  model.conduits.forEach(cd => { ln(`${cd.id.padEnd(17)}CIRCULAR     ${cd.diam.toFixed(1).padStart(16)} ${"0".padStart(10)} ${"0".padStart(10)} ${"0".padStart(10)} ${"1".padStart(10)}`); });
  if (model.orifices) {
    model.orifices.forEach(o => { ln(`${o.id.padEnd(17)}CIRCULAR     ${o.diam.toFixed(1).padStart(16)} ${"0".padStart(10)} ${"0".padStart(10)} ${"0".padStart(10)} ${"1".padStart(10)}`); });
  }
  if (model.weirs) {
    model.weirs.forEach(w => { ln(`${w.id.padEnd(17)}RECT_OPEN    ${w.diam.toFixed(1).padStart(16)} ${(w.diam * 0.5).toFixed(1).padStart(10)} ${"0".padStart(10)} ${"0".padStart(10)} ${"1".padStart(10)}`); });
  }
  ln();

  if (wq.enabled) {
    const selPolls = POLLUTANTS.filter(p => wq.selectedPollutants.includes(p.id));

    ln("[POLLUTANTS]");
    ln(";;Name           Units  Crain      Cgw        Crdii      Kdecay     SnowOnly   Co_Pollutant     Co_Frac    Cdwf       Cinit");
    selPolls.forEach(p => {
      ln(`${p.id.padEnd(17)}${p.units.padEnd(7)}${p.cRain.toFixed(1).padStart(10)} ${p.cGW.toFixed(1).padStart(10)} ${p.cRDII.toFixed(1).padStart(10)} ${p.decayCoeff.toFixed(1).padStart(10)} ${p.snowOnly.padStart(10)} ${p.coPollutant.padStart(17)} ${p.coFrac.toFixed(2).padStart(10)} ${"0".padStart(10)} ${p.cInit.toFixed(1).padStart(10)}`);
    }); ln();

    const usedLandUses = new Set();
    model.subcatchments.forEach(sc => {
      if (sc.surfKeys) {
        sc.surfKeys.forEach(sk => {
          if (LANDUSES[sk]) usedLandUses.add(LANDUSES[sk].id);
        });
      } else {
        usedLandUses.add("Residential_Lawn");
      }
    });
    const luArr = [...usedLandUses];

    ln("[LANDUSES]");
    ln(";;               Sweeping   Sweeping   Sweeping");
    ln(";;Name           Interval   Available  Last Swept");
    luArr.forEach(lu => {
      const def = Object.values(LANDUSES).find(v => v.id === lu) || { sweepInterval: 0, sweepFrac: 0, sweepRemoval: 0 };
      ln(`${lu.padEnd(17)}${String(def.sweepInterval).padStart(10)} ${def.sweepFrac.toFixed(1).padStart(10)} ${"0".padStart(10)}`);
    }); ln();

    ln("[COVERAGES]");
    ln(";;Subcatchment   Land Use         Percent");
    model.subcatchments.forEach(sc => {
      const luId = sc.surfKeys && sc.surfKeys.length > 0 && LANDUSES[sc.surfKeys[0]]
        ? LANDUSES[sc.surfKeys[0]].id : "Residential_Lawn";
      ln(`${sc.id.padEnd(17)}${luId.padEnd(17)}100`);
    }); ln();

    ln("[BUILDUP]");
    ln(";;Land Use       Pollutant        Function   Coeff1     Coeff2     Coeff3     Per Unit");
    luArr.forEach(lu => {
      selPolls.forEach(p => {
        const b = (BUILDUP[lu] || {})[p.id];
        if (b) {
          ln(`${lu.padEnd(17)}${p.id.padEnd(17)}${b.func.padEnd(11)}${b.c1.toString().padStart(10)} ${b.c2.toString().padStart(10)} ${b.c3.toString().padStart(10)} AREA`);
        }
      });
    }); ln();

    ln("[WASHOFF]");
    ln(";;Land Use       Pollutant        Function   Coeff1     Coeff2     SweepRmvl  BmpRmvl");
    luArr.forEach(lu => {
      selPolls.forEach(p => {
        const w = (WASHOFF[lu] || {})[p.id];
        if (w) {
          ln(`${lu.padEnd(17)}${p.id.padEnd(17)}${w.func.padEnd(11)}${w.c1.toString().padStart(10)} ${w.c2.toString().padStart(10)} ${w.sweepEff.toString().padStart(10)} ${w.bmpEff.toString().padStart(10)}`);
        }
      });
    }); ln();
  }

  ln("[TIMESERIES]"); ln(";;Name           Time       Value");
  storm.rain.forEach((v, i) => { ln(`TS_Rain          ${(i * rainIntvMin)}          ${v.toFixed(2)}`); }); ln();

  ln("[COORDINATES]");
  model.allNodes.forEach(n => { ln(`${n.id.padEnd(17)}${(n.c*cellSpc).toFixed(3).padStart(18)} ${((GRID-1-n.r)*cellSpc).toFixed(3).padStart(18)}`); }); ln();

  ln("[REPORT]"); ln("SUBCATCHMENTS ALL"); ln("NODES ALL"); ln("LINKS ALL"); ln();
  return inp;
}
