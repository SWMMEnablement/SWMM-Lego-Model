export function generateHtmlReport(simResult, storm, gridSize, networkStats) {
  const sys = simResult.systemHistory;
  const peakRunoff = Math.max(...sys.map(s => s.totalRunoff));
  const peakPipe = Math.max(...sys.map(s => s.totalPipeFlow));
  const peakOutfall = Math.max(...sys.map(s => s.outfallFlow));
  const nodeDepths = simResult.nodes.flatMap(n => n.history.map(h => h.depth));
  const maxNodeDepth = nodeDepths.length > 0 ? Math.max(...nodeDepths) : 0;
  const totalRain = sys.reduce((s, h, i, a) => {
    if (i === 0) return 0;
    const dt = (h.t - a[i-1].t) / 60;
    return s + h.rainfall * dt;
  }, 0);

  const sysJSON = JSON.stringify(sys.filter((_, i) => i % Math.max(1, Math.floor(sys.length / 300)) === 0 || i === sys.length - 1));

  const nodeData = simResult.nodes.slice(0, 8).map(n => ({
    id: n.id,
    maxDepth: n.maxDepth,
    data: n.history.filter((_, i) => i % Math.max(1, Math.floor(n.history.length / 200)) === 0 || i === n.history.length - 1)
  }));
  const nodeJSON = JSON.stringify(nodeData);

  const pipeData = simResult.conduits.slice(0, 8).map(cd => ({
    id: cd.id,
    data: cd.history.filter((_, i) => i % Math.max(1, Math.floor(cd.history.length / 200)) === 0 || i === cd.history.length - 1)
  }));
  const pipeJSON = JSON.stringify(pipeData);

  const scData = simResult.subcatchments.slice(0, 8).map(sc => ({
    id: sc.id, area: sc.area_ac, cn: sc.cn, pctImperv: sc.pctImperv,
    data: sc.history.filter((_, i) => i % Math.max(1, Math.floor(sc.history.length / 200)) === 0 || i === sc.history.length - 1)
  }));
  const scJSON = JSON.stringify(scData);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SWMM5 LEGO Builder — Simulation Report</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700;800&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #1B2A34; font-family: 'Fredoka', sans-serif; color: #1B2A34; padding: 20px; }
  .page { max-width: 1100px; margin: 0 auto; }
  .header {
    text-align: center; margin-bottom: 24px; padding: 20px;
    background: linear-gradient(135deg, #D01012 0%, #A00C0E 100%);
    border-radius: 8px; border: 4px solid #F2C717;
    box-shadow: 0 6px 0 rgba(0,0,0,0.4), inset 0 2px 0 rgba(255,255,255,0.2);
  }
  .header h1 { font-size: 28px; color: #F2C717; text-shadow: 3px 3px 0 rgba(0,0,0,0.5); font-weight: 900; }
  .header p { color: #F4F4F4; font-size: 13px; margin-top: 4px; font-weight: 600; }
  .header .meta { color: rgba(255,255,255,0.7); font-size: 11px; margin-top: 8px; }
  .stats-grid {
    display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 10px; margin-bottom: 20px;
  }
  .stat-card {
    background: #F4F4F4; border-radius: 6px; padding: 14px; text-align: center;
    border: 3px solid #6C6E68;
    box-shadow: 4px 4px 0 rgba(0,0,0,0.35), inset 0 2px 0 rgba(255,255,255,0.5);
  }
  .stat-card .value { font-size: 24px; font-weight: 900; }
  .stat-card .label { font-size: 10px; color: #6C6E68; font-weight: 700; margin-top: 2px; text-transform: uppercase; }
  .chart-panel {
    background: #F4F4F4; border-radius: 6px; padding: 16px; margin-bottom: 16px;
    border: 3px solid #6C6E68;
    box-shadow: 4px 4px 0 rgba(0,0,0,0.35), inset 0 2px 0 rgba(255,255,255,0.5);
  }
  .chart-panel h2 {
    font-size: 15px; font-weight: 900; margin-bottom: 12px; padding-bottom: 6px;
    border-bottom: 3px solid #E4CD9E;
  }
  .chart-panel h3 { font-size: 12px; font-weight: 800; margin: 12px 0 8px; color: #006DB7; }
  canvas { width: 100%; border-radius: 4px; background: #fff; border: 2px solid #E4CD9E; }
  .legend { display: flex; gap: 16px; flex-wrap: wrap; margin-top: 8px; justify-content: center; }
  .legend-item { display: flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 700; }
  .legend-dot { width: 12px; height: 12px; border-radius: 3px; }
  .sub-cards {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
    gap: 8px; margin-top: 12px;
  }
  .sub-card {
    background: #fff; border-radius: 4px; padding: 8px; text-align: center;
    border: 2px solid #E4CD9E;
    box-shadow: 2px 2px 0 rgba(0,0,0,0.1);
  }
  .sub-card .sc-name { font-size: 11px; font-weight: 800; color: #70C442; }
  .sub-card .sc-detail { font-size: 9px; color: #6C6E68; font-weight: 600; }
  .footer {
    text-align: center; padding: 14px; font-size: 10px; color: #9BA19D;
    font-weight: 700; letter-spacing: 0.5px;
  }
  @media print {
    body { background: #fff; padding: 10px; }
    .chart-panel { break-inside: avoid; box-shadow: none; border: 2px solid #ccc; }
    .header { box-shadow: none; }
    .stat-card { box-shadow: none; }
  }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <h1>🧱 SWMM5 LEGO Builder Report</h1>
    <p>Quick Sim Results — SCS Curve Number + Manning's Equation</p>
    <div class="meta">
      Storm: ${storm.name} | Grid: ${gridSize}×${gridSize} |
      Generated: ${new Date().toLocaleString()}
    </div>
  </div>

  <div class="stats-grid">
    <div class="stat-card"><div class="value" style="color:#70C442">${peakRunoff.toFixed(3)}</div><div class="label">Peak Runoff (CFS)</div></div>
    <div class="stat-card"><div class="value" style="color:#5A93DB">${peakPipe.toFixed(3)}</div><div class="label">Peak Pipe Flow (CFS)</div></div>
    <div class="stat-card"><div class="value" style="color:#D01012">${peakOutfall.toFixed(3)}</div><div class="label">Peak Outfall (CFS)</div></div>
    <div class="stat-card"><div class="value" style="color:#F2C717">${maxNodeDepth.toFixed(2)}</div><div class="label">Max Node Depth (ft)</div></div>
    <div class="stat-card"><div class="value" style="color:#006DB7">${totalRain.toFixed(2)}</div><div class="label">Total Rainfall (in)</div></div>
    <div class="stat-card"><div class="value" style="color:#FE8A18">${(sys[sys.length-1]?.t || 0).toFixed(0)}</div><div class="label">Duration (min)</div></div>
    <div class="stat-card"><div class="value" style="color:#4B9F4A">${networkStats.subcatchments}</div><div class="label">Subcatchments</div></div>
    <div class="stat-card"><div class="value" style="color:#6C6E68">${networkStats.nodes}</div><div class="label">Nodes</div></div>
    <div class="stat-card"><div class="value" style="color:#006DB7">${networkStats.conduits}</div><div class="label">Conduits</div></div>
  </div>

  <div class="chart-panel">
    <h2 style="color:#006DB7">📊 System Hydrograph — Rainfall vs Runoff vs Outfall</h2>
    <canvas id="sysChart" height="280"></canvas>
    <div class="legend">
      <div class="legend-item"><div class="legend-dot" style="background:#70C442"></div>Runoff (CFS)</div>
      <div class="legend-item"><div class="legend-dot" style="background:#5A93DB"></div>Pipe Flow (CFS)</div>
      <div class="legend-item"><div class="legend-dot" style="background:#D01012"></div>Outfall (CFS)</div>
    </div>
    <h3>Rainfall Hyetograph (in/hr)</h3>
    <canvas id="rainChart" height="120"></canvas>
    <div class="legend">
      <div class="legend-item"><div class="legend-dot" style="background:#5A93DB"></div>Rainfall (in/hr)</div>
    </div>
  </div>

  <div class="chart-panel">
    <h2 style="color:#4B9F4A">🌧️ Subcatchment Runoff</h2>
    <canvas id="scChart" height="260"></canvas>
    <div id="scLegend" class="legend"></div>
    <div id="scCards" class="sub-cards"></div>
  </div>

  <div class="chart-panel">
    <h2 style="color:#FE8A18">⚙️ Node Depths</h2>
    <canvas id="nodeChart" height="260"></canvas>
    <div id="nodeLegend" class="legend"></div>
  </div>

  <div class="chart-panel">
    <h2 style="color:#006DB7">🔵 Conduit Flows</h2>
    <canvas id="pipeChart" height="260"></canvas>
    <div id="pipeLegend" class="legend"></div>
  </div>

  <div class="footer">
    SWMM5 LEGO Builder • Quick Sim Engine (SCS-CN + Manning's) • ${new Date().getFullYear()}
  </div>
</div>

<script>
const SYS = ${sysJSON};
const NODES = ${nodeJSON};
const PIPES = ${pipeJSON};
const SUBCATCH = ${scJSON};
const COLORS = ['#70C442','#5A93DB','#D01012','#F2C717','#FE8A18','#006DB7','#6C6E68','#4B9F4A'];

function drawLineChart(canvasId, datasets, xKey, yKeys, colors, yLabel) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  const W = rect.width, H = rect.height;
  const pad = { top: 15, right: 15, bottom: 35, left: 55 };
  const plotW = W - pad.left - pad.right;
  const plotH = H - pad.top - pad.bottom;

  let allVals = [];
  let allX = [];
  datasets.forEach(ds => {
    ds.forEach(d => {
      allX.push(d[xKey]);
      yKeys.forEach(k => { if (d[k] !== undefined) allVals.push(d[k]); });
    });
  });
  const xMin = Math.min(...allX), xMax = Math.max(...allX);
  const yMin = 0, yMax = Math.max(...allVals) * 1.1 || 1;
  const toX = v => pad.left + ((v - xMin) / (xMax - xMin || 1)) * plotW;
  const toY = v => pad.top + plotH - ((v - yMin) / (yMax - yMin || 1)) * plotH;

  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = '#E4CD9E';
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= 5; i++) {
    const y = pad.top + (plotH / 5) * i;
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + plotW, y); ctx.stroke();
  }
  for (let i = 0; i <= 5; i++) {
    const x = pad.left + (plotW / 5) * i;
    ctx.beginPath(); ctx.moveTo(x, pad.top); ctx.lineTo(x, pad.top + plotH); ctx.stroke();
  }

  ctx.strokeStyle = '#1B2A34';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(pad.left, pad.top); ctx.lineTo(pad.left, pad.top + plotH);
  ctx.lineTo(pad.left + plotW, pad.top + plotH);
  ctx.stroke();

  ctx.fillStyle = '#1B2A34';
  ctx.font = '600 10px Fredoka, sans-serif';
  ctx.textAlign = 'center';
  for (let i = 0; i <= 5; i++) {
    const v = xMin + ((xMax - xMin) / 5) * i;
    ctx.fillText(v.toFixed(0), toX(v), pad.top + plotH + 16);
  }
  ctx.fillText('Time (min)', pad.left + plotW / 2, H - 4);

  ctx.textAlign = 'right';
  for (let i = 0; i <= 5; i++) {
    const v = yMin + ((yMax - yMin) / 5) * i;
    ctx.fillText(v.toFixed(2), pad.left - 6, toY(v) + 3);
  }
  ctx.save();
  ctx.translate(12, pad.top + plotH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.font = '700 10px Fredoka, sans-serif';
  ctx.fillText(yLabel, 0, 0);
  ctx.restore();

  datasets.forEach((ds, di) => {
    yKeys.forEach((k, ki) => {
      const color = colors[di * yKeys.length + ki] || colors[di] || COLORS[di % COLORS.length];
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ds.forEach((d, i) => {
        const px = toX(d[xKey]), py = toY(d[k] || 0);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      });
      ctx.stroke();
    });
  });
}

function drawBarChart(canvasId, data, xKey, yKey, color) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  const W = rect.width, H = rect.height;
  const pad = { top: 10, right: 15, bottom: 30, left: 55 };
  const plotW = W - pad.left - pad.right;
  const plotH = H - pad.top - pad.bottom;
  const sampled = data.filter((_, i) => i % Math.max(1, Math.floor(data.length / 40)) === 0);
  const yMax = Math.max(...sampled.map(d => d[yKey])) * 1.15 || 1;
  const barW = Math.max(2, plotW / sampled.length - 1);

  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = '#E4CD9E'; ctx.lineWidth = 0.5;
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + (plotH / 4) * i;
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + plotW, y); ctx.stroke();
  }

  sampled.forEach((d, i) => {
    const x = pad.left + (i / sampled.length) * plotW;
    const h = (d[yKey] / yMax) * plotH;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x, pad.top + plotH - h, barW, h, [2, 2, 0, 0]);
    ctx.fill();
  });

  ctx.strokeStyle = '#1B2A34'; ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(pad.left, pad.top); ctx.lineTo(pad.left, pad.top + plotH);
  ctx.lineTo(pad.left + plotW, pad.top + plotH);
  ctx.stroke();

  ctx.fillStyle = '#1B2A34';
  ctx.font = '600 9px Fredoka, sans-serif';
  ctx.textAlign = 'right';
  for (let i = 0; i <= 4; i++) {
    const v = (yMax / 4) * (4 - i);
    ctx.fillText(v.toFixed(2), pad.left - 5, pad.top + (plotH / 4) * i + 4);
  }
  ctx.textAlign = 'center';
  ctx.fillText('Time (min)', pad.left + plotW / 2, H - 4);
}

function buildLegend(containerId, items) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = items.map(([color, name]) =>
    '<div class="legend-item"><div class="legend-dot" style="background:' + color + '"></div>' + name + '</div>'
  ).join('');
}

window.addEventListener('load', function() {
  drawLineChart('sysChart', [SYS], 't', ['totalRunoff', 'totalPipeFlow', 'outfallFlow'], ['#70C442', '#5A93DB', '#D01012'], 'Flow (CFS)');
  drawBarChart('rainChart', SYS, 't', 'rainfall', '#5A93DB');

  if (SUBCATCH.length > 0) {
    const scColors = SUBCATCH.map((_, i) => COLORS[i % COLORS.length]);
    drawLineChart('scChart', SUBCATCH.map(s => s.data), 't', ['runoff'], scColors, 'Runoff (CFS)');
    buildLegend('scLegend', SUBCATCH.map((s, i) => [scColors[i], s.id]));
    const cardsEl = document.getElementById('scCards');
    if (cardsEl) {
      cardsEl.innerHTML = SUBCATCH.map(s =>
        '<div class="sub-card"><div class="sc-name">' + s.id + '</div>' +
        '<div class="sc-detail">' + s.area.toFixed(2) + ' ac • CN=' + s.cn.toFixed(0) + '</div>' +
        '<div class="sc-detail">' + s.pctImperv.toFixed(0) + '% imperv</div></div>'
      ).join('');
    }
  }

  if (NODES.length > 0) {
    const nColors = NODES.map((_, i) => COLORS[i % COLORS.length]);
    drawLineChart('nodeChart', NODES.map(n => n.data), 't', ['depth'], nColors, 'Depth (ft)');
    buildLegend('nodeLegend', NODES.map((n, i) => [nColors[i], n.id + ' (max=' + n.maxDepth.toFixed(1) + 'ft)']));
  }

  if (PIPES.length > 0) {
    const pColors = PIPES.map((_, i) => COLORS[i % COLORS.length]);
    drawLineChart('pipeChart', PIPES.map(p => p.data), 't', ['flow'], pColors, 'Flow (CFS)');
    buildLegend('pipeLegend', PIPES.map((p, i) => [pColors[i], p.id]));
  }

  window.addEventListener('resize', function() {
    drawLineChart('sysChart', [SYS], 't', ['totalRunoff', 'totalPipeFlow', 'outfallFlow'], ['#70C442', '#5A93DB', '#D01012'], 'Flow (CFS)');
    drawBarChart('rainChart', SYS, 't', 'rainfall', '#5A93DB');
    if (SUBCATCH.length > 0) {
      drawLineChart('scChart', SUBCATCH.map(s => s.data), 't', ['runoff'], SUBCATCH.map((_, i) => COLORS[i % COLORS.length]), 'Runoff (CFS)');
    }
    if (NODES.length > 0) {
      drawLineChart('nodeChart', NODES.map(n => n.data), 't', ['depth'], NODES.map((_, i) => COLORS[i % COLORS.length]), 'Depth (ft)');
    }
    if (PIPES.length > 0) {
      drawLineChart('pipeChart', PIPES.map(p => p.data), 't', ['flow'], PIPES.map((_, i) => COLORS[i % COLORS.length]), 'Flow (CFS)');
    }
  });
});
<\/script>
</body>
</html>`;
}
