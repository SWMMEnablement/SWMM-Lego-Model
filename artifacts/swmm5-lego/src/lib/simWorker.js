import { setGrid as setGridGlobal } from './elements.js';
import { runSWMM5 } from './hydraulics.js';

self.onmessage = function(e) {
  const { grid, storm, cellProps, gridSize } = e.data;
  try {
    if (gridSize) setGridGlobal(gridSize);
    const result = runSWMM5(grid, storm, cellProps);
    self.postMessage({ type: 'result', data: result });
  } catch (err) {
    self.postMessage({ type: 'error', message: err.message });
  }
};
