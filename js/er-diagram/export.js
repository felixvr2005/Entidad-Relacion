// ===================================================================
// PNG EXPORT — Hi-DPI offscreen canvas export with light theme
// ===================================================================

function exportPng() {
  const S = ERDiagram.State;
  const R = ERDiagram.RENDER;

  if (S.tables.length === 0) {
    showToast('No hay diagrama para exportar. Genera uno primero.', 'error');
    return;
  }

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [, pos] of S.tablePositions) {
    minX = Math.min(minX, pos.x);
    minY = Math.min(minY, pos.y);
    maxX = Math.max(maxX, pos.x + pos.w);
    maxY = Math.max(maxY, pos.y + (pos.h || 400));
  }

  const padding = 80;
  const totalW = maxX - minX + padding * 2;
  const totalH = maxY - minY + padding * 2;

  const exportScale = 2;
  const offCanvas = document.createElement('canvas');
  offCanvas.width = totalW * exportScale;
  offCanvas.height = totalH * exportScale;
  const offCtx = offCanvas.getContext('2d');
  offCtx.scale(exportScale, exportScale);

  // White background
  offCtx.fillStyle = '#ffffff';
  offCtx.fillRect(0, 0, totalW, totalH);

  // Grid
  offCtx.strokeStyle = 'rgba(200,200,220,0.3)';
  offCtx.lineWidth = 0.5;
  offCtx.beginPath();
  for (let x = 0; x < totalW; x += R.gridSize) { offCtx.moveTo(x, 0); offCtx.lineTo(x, totalH); }
  for (let y = 0; y < totalH; y += R.gridSize) { offCtx.moveTo(0, y); offCtx.lineTo(totalW, y); }
  offCtx.stroke();

  offCtx.translate(padding - minX, padding - minY);

  // Override colors for light theme
  const origColors = {};
  const lightOverrides = {
    rowBg: '#f8f9fc', rowBgAlt: '#eef1f8', rowText: '#3a3f55',
    borderColor: '#c0c8e0', headerGradientStart: '#4a5899', headerGradientEnd: '#3a4578',
    shadowColor: 'rgba(0,0,0,0.15)', headerText: '#ffffff',
    pkColor: '#b8860b', fkColor: '#4169e1', typeColor: '#2a7fff',
    nnColor: '#d94040', defaultColor: '#8855cc', checkColor: '#cc7722',
    ukColor: '#228b22',
  };
  for (const [key, val] of Object.entries(lightOverrides)) {
    origColors[key] = R[key];
    R[key] = val;
  }

  // Draw relationships
  drawRelationships(offCtx, S, R);

  // Draw tables
  for (const table of S.tables) {
    const pos = S.tablePositions.get(table.name);
    if (pos) drawTable(offCtx, table, pos, R);
  }

  // Title
  offCtx.save();
  offCtx.setTransform(exportScale, 0, 0, exportScale, 0, 0);
  offCtx.font = 'bold 16px "Segoe UI", system-ui, sans-serif';
  offCtx.fillStyle = '#3a4578';
  offCtx.textAlign = 'left';
  offCtx.textBaseline = 'top';
  offCtx.fillText('Diagrama Entidad-Relación', 20, 15);
  offCtx.font = '11px "Segoe UI", system-ui, sans-serif';
  offCtx.fillStyle = '#888';
  offCtx.fillText(`${S.tables.length} tablas · ${S.relationships.length} relaciones · Generado: ${new Date().toLocaleDateString('es-ES')}`, 20, 38);
  offCtx.restore();

  // Restore original colors
  for (const [key, val] of Object.entries(origColors)) {
    R[key] = val;
  }

  offCanvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diagrama-er-${new Date().toISOString().slice(0,10)}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('PNG descargado correctamente.', 'success', 3000);
  }, 'image/png');
}
