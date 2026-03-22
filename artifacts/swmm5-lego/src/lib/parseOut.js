export function parseOutBinary(buffer) {
  const data = new DataView(buffer);
  const u8 = new Uint8Array(buffer);
  const totalBytes = buffer.byteLength;
  let pos = 0;

  const getInt = () => {
    if (pos + 4 > totalBytes) throw new Error(`Read INT past end at pos=${pos}, total=${totalBytes}`);
    const v = data.getInt32(pos, true); pos += 4; return v;
  };
  const getFloat = () => {
    if (pos + 4 > totalBytes) throw new Error(`Read FLOAT past end at pos=${pos}, total=${totalBytes}`);
    const v = data.getFloat32(pos, true); pos += 4; return v;
  };
  const getDouble = () => {
    if (pos + 8 > totalBytes) throw new Error(`Read DOUBLE past end at pos=${pos}, total=${totalBytes}`);
    const v = data.getFloat64(pos, true); pos += 8; return v;
  };
  const getString = () => {
    const len = getInt();
    if (len < 0 || len > 256) throw new Error(`Invalid string length ${len} at pos=${pos - 4}`);
    if (pos + len > totalBytes) throw new Error(`String read past end at pos=${pos}, len=${len}`);
    let s = '';
    for (let i = 0; i < len; i++) s += String.fromCharCode(u8[pos + i]);
    pos += len;
    return s;
  };

  const MAGIC = 516114522;
  const magic1 = getInt();
  if (magic1 !== MAGIC) {
    throw new Error(`Invalid SWMM5 .out file (magic=${magic1}, expected=${MAGIC})`);
  }

  const version = getInt();
  const flowUnits = getInt();
  const nSubcatch = getInt();
  const nNodes = getInt();
  const nLinks = getInt();
  const nPolluts = getInt();

  if (nSubcatch < 0 || nSubcatch > 10000 || nNodes < 0 || nNodes > 10000 ||
      nLinks < 0 || nLinks > 10000 || nPolluts < 0 || nPolluts > 100) {
    throw new Error(`Unreasonable object counts: subcatch=${nSubcatch}, nodes=${nNodes}, links=${nLinks}, polluts=${nPolluts}`);
  }

  const FLOW_UNIT_LABELS = ['CFS', 'GPM', 'MGD', 'CMS', 'LPS', 'MLD'];
  const flowUnitLabel = FLOW_UNIT_LABELS[flowUnits] || 'CFS';

  const subcatchIds = [];
  for (let i = 0; i < nSubcatch; i++) subcatchIds.push(getString());

  const nodeIds = [];
  for (let i = 0; i < nNodes; i++) nodeIds.push(getString());

  const linkIds = [];
  for (let i = 0; i < nLinks; i++) linkIds.push(getString());

  const pollutIds = [];
  for (let i = 0; i < nPolluts; i++) {
    pollutIds.push(getString());
    getInt();
  }

  const nSubcatchProps = getInt();
  for (let i = 0; i < nSubcatchProps; i++) getInt();
  const subcatchProps = [];
  for (let i = 0; i < nSubcatch; i++) {
    const props = {};
    for (let j = 0; j < nSubcatchProps; j++) {
      if (j === 0) props.area = getFloat();
      else getFloat();
    }
    subcatchProps.push(props);
  }

  const nNodeProps = getInt();
  for (let i = 0; i < nNodeProps; i++) getInt();
  const nodeProps = [];
  for (let i = 0; i < nNodes; i++) {
    const props = {};
    for (let j = 0; j < nNodeProps; j++) {
      if (j === 0) props.type = getFloat();
      else if (j === 1) props.invertElev = getFloat();
      else if (j === 2) props.maxDepth = getFloat();
      else getFloat();
    }
    nodeProps.push(props);
  }

  const nLinkProps = getInt();
  for (let i = 0; i < nLinkProps; i++) getInt();
  const linkProps = [];
  for (let i = 0; i < nLinks; i++) {
    const props = {};
    for (let j = 0; j < nLinkProps; j++) {
      if (j === 0) props.type = getFloat();
      else if (j === 1) props.upOffset = getFloat();
      else if (j === 2) props.dnOffset = getFloat();
      else if (j === 3) props.maxDepth = getFloat();
      else if (j === 4) props.length = getFloat();
      else getFloat();
    }
    linkProps.push(props);
  }

  const nSubcatchVars = getInt();
  for (let i = 0; i < nSubcatchVars; i++) getInt();

  const nNodeVars = getInt();
  for (let i = 0; i < nNodeVars; i++) getInt();

  const nLinkVars = getInt();
  for (let i = 0; i < nLinkVars; i++) getInt();

  const nSysVars = getInt();
  for (let i = 0; i < nSysVars; i++) getInt();

  const startDate = getDouble();
  const reportStep = getInt();

  const footerSize = 6 * 4;
  const footerStart = totalBytes - footerSize;
  const footerView = new DataView(buffer, footerStart);
  const idNamesOffset = footerView.getInt32(0, true);
  const propsOffset = footerView.getInt32(4, true);
  const resultsOffset = footerView.getInt32(8, true);
  const nPeriods = footerView.getInt32(12, true);
  const errorCode = footerView.getInt32(16, true);
  const magic2 = footerView.getInt32(20, true);

  if (magic2 !== MAGIC) {
    throw new Error(`Invalid SWMM5 .out footer (magic2=${magic2})`);
  }

  const SUBCATCH_VAR_NAMES = ['rainfall', 'snowDepth', 'evapLoss', 'infilLoss', 'runoff', 'gwOutflow', 'gwElev', 'soilMoisture'];
  const NODE_VAR_NAMES = ['depth', 'head', 'volume', 'lateralInflow', 'totalInflow', 'flooding'];
  const LINK_VAR_NAMES = ['flow', 'depth', 'velocity', 'volume', 'capacity'];
  const SYS_VAR_NAMES = [
    'airTemp', 'rainfall', 'snowDepth', 'evapInfilLoss', 'runoff',
    'dryWeatherInflow', 'gwInflow', 'rdiiInflow', 'directInflow',
    'totalLatInflow', 'flooding', 'outfallFlow', 'storageVolume', 'actualEvap'
  ];

  const subcatchResults = subcatchIds.map((id, i) => ({
    id, ...subcatchProps[i], history: []
  }));
  const nodeResults = nodeIds.map((id, i) => ({
    id, ...nodeProps[i], history: []
  }));
  const linkResults = linkIds.map((id, i) => ({
    id, ...linkProps[i], history: []
  }));
  const systemHistory = [];

  pos = resultsOffset;

  for (let p = 0; p < nPeriods; p++) {
    if (pos + 8 > footerStart) break;

    const dateVal = getDouble();
    const tMinutes = p * (reportStep / 60);

    for (let s = 0; s < nSubcatch; s++) {
      const rec = { t: tMinutes };
      for (let v = 0; v < nSubcatchVars; v++) {
        const val = getFloat();
        const name = v < SUBCATCH_VAR_NAMES.length ? SUBCATCH_VAR_NAMES[v] : `pollut_${v - SUBCATCH_VAR_NAMES.length}`;
        rec[name] = val;
      }
      subcatchResults[s].history.push(rec);
    }

    for (let n = 0; n < nNodes; n++) {
      const rec = { t: tMinutes };
      for (let v = 0; v < nNodeVars; v++) {
        const val = getFloat();
        const name = v < NODE_VAR_NAMES.length ? NODE_VAR_NAMES[v] : `pollut_${v - NODE_VAR_NAMES.length}`;
        rec[name] = val;
      }
      nodeResults[n].history.push(rec);
    }

    for (let l = 0; l < nLinks; l++) {
      const rec = { t: tMinutes };
      for (let v = 0; v < nLinkVars; v++) {
        const val = getFloat();
        const name = v < LINK_VAR_NAMES.length ? LINK_VAR_NAMES[v] : `pollut_${v - LINK_VAR_NAMES.length}`;
        rec[name] = val;
      }
      linkResults[l].history.push(rec);
    }

    const sysRec = { t: tMinutes };
    for (let v = 0; v < nSysVars; v++) {
      const val = getFloat();
      const name = v < SYS_VAR_NAMES.length ? SYS_VAR_NAMES[v] : `sys_${v}`;
      sysRec[name] = val;
    }
    systemHistory.push(sysRec);
  }

  const actualPeriods = systemHistory.length;

  return {
    version,
    flowUnits: flowUnitLabel,
    nPeriods: actualPeriods,
    reportStep,
    errorCode,
    subcatchIds,
    nodeIds,
    linkIds,
    pollutIds,
    subcatchResults,
    nodeResults,
    linkResults,
    systemHistory,
  };
}
