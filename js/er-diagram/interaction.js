// ===================================================================
// INTERACTIVITY — Zoom, pan, drag tables, hover tooltips
// ===================================================================

function setupERInteraction() {
  const canvas = ERDiagram.canvas;
  const S = ERDiagram.State;
  const R = ERDiagram.RENDER;

  // Store handler references for cleanup
  const handlers = {};

  handlers.wheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.1, Math.min(4, S.scale * delta));
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    S.offsetX = mx - (mx - S.offsetX) * (newScale / S.scale);
    S.offsetY = my - (my - S.offsetY) * (newScale / S.scale);
    S.scale = newScale;
    const zi = document.getElementById('erZoomIndicator');
    if (zi) zi.textContent = Math.round(S.scale * 100) + '%';
    renderER();
  };

  handlers.mousedown = (e) => {
    const { worldX, worldY } = erScreenToWorld(e.clientX, e.clientY);
    for (const table of S.tables) {
      const pos = S.tablePositions.get(table.name);
      if (pos && worldX >= pos.x && worldX <= pos.x + pos.w && worldY >= pos.y && worldY <= pos.y + pos.h) {
        S.draggingTable = table.name;
        S.tableDragOffsetX = worldX - pos.x;
        S.tableDragOffsetY = worldY - pos.y;
        canvas.classList.add('moving-table');
        e.preventDefault();
        return;
      }
    }
    S.isDragging = true;
    S.dragStartX = e.clientX - S.offsetX;
    S.dragStartY = e.clientY - S.offsetY;
    canvas.classList.add('grabbing');
  };

  handlers.mousemove = (e) => {
    if (S.draggingTable) {
      const { worldX, worldY } = erScreenToWorld(e.clientX, e.clientY);
      const pos = S.tablePositions.get(S.draggingTable);
      if (pos) { pos.x = worldX - S.tableDragOffsetX; pos.y = worldY - S.tableDragOffsetY; renderER(); }
      return;
    }
    if (S.isDragging) {
      S.offsetX = e.clientX - S.dragStartX;
      S.offsetY = e.clientY - S.dragStartY;
      renderER();
      return;
    }
    erHandleHover(e);
  };

  handlers.mouseup = () => {
    S.isDragging = false;
    S.draggingTable = null;
    canvas.classList.remove('grabbing');
    canvas.classList.remove('moving-table');
  };

  handlers.mouseleave = () => {
    S.isDragging = false;
    S.draggingTable = null;
    canvas.classList.remove('grabbing');
    canvas.classList.remove('moving-table');
    const tt = document.getElementById('erTooltip');
    if (tt) tt.style.display = 'none';
  };

  canvas.addEventListener('wheel', handlers.wheel, { passive: false });
  canvas.addEventListener('mousedown', handlers.mousedown);
  canvas.addEventListener('mousemove', handlers.mousemove);
  canvas.addEventListener('mouseup', handlers.mouseup);
  canvas.addEventListener('mouseleave', handlers.mouseleave);

  // Button handlers
  const btnZoomIn = document.getElementById('erBtnZoomIn');
  const btnZoomOut = document.getElementById('erBtnZoomOut');
  const btnResetView = document.getElementById('erBtnResetView');
  const btnFitView = document.getElementById('erBtnFitView');

  handlers.zoomIn = () => erZoom(1.2);
  handlers.zoomOut = () => erZoom(0.8);
  handlers.resetView = erResetView;
  handlers.fitView = erFitView;

  if (btnZoomIn) btnZoomIn.addEventListener('click', handlers.zoomIn);
  if (btnZoomOut) btnZoomOut.addEventListener('click', handlers.zoomOut);
  if (btnResetView) btnResetView.addEventListener('click', handlers.resetView);
  if (btnFitView) btnFitView.addEventListener('click', handlers.fitView);

  ERDiagram._handlers = handlers;
}

function teardownERInteraction() {
  const canvas = ERDiagram.canvas;
  const h = ERDiagram._handlers;
  if (!canvas || !h) return;

  canvas.removeEventListener('wheel', h.wheel);
  canvas.removeEventListener('mousedown', h.mousedown);
  canvas.removeEventListener('mousemove', h.mousemove);
  canvas.removeEventListener('mouseup', h.mouseup);
  canvas.removeEventListener('mouseleave', h.mouseleave);

  const b1 = document.getElementById('erBtnZoomIn');
  const b2 = document.getElementById('erBtnZoomOut');
  const b3 = document.getElementById('erBtnResetView');
  const b4 = document.getElementById('erBtnFitView');
  if (b1) b1.removeEventListener('click', h.zoomIn);
  if (b2) b2.removeEventListener('click', h.zoomOut);
  if (b3) b3.removeEventListener('click', h.resetView);
  if (b4) b4.removeEventListener('click', h.fitView);

  ERDiagram._handlers = null;
}

function erScreenToWorld(clientX, clientY) {
  const rect = ERDiagram.canvas.getBoundingClientRect();
  const sx = clientX - rect.left;
  const sy = clientY - rect.top;
  return {
    worldX: (sx - ERDiagram.State.offsetX) / ERDiagram.State.scale,
    worldY: (sy - ERDiagram.State.offsetY) / ERDiagram.State.scale,
  };
}

function erZoom(factor) {
  const S = ERDiagram.State;
  const rect = ERDiagram.canvas.getBoundingClientRect();
  const cx = rect.width / 2;
  const cy = rect.height / 2;
  const newScale = Math.max(0.1, Math.min(4, S.scale * factor));
  S.offsetX = cx - (cx - S.offsetX) * (newScale / S.scale);
  S.offsetY = cy - (cy - S.offsetY) * (newScale / S.scale);
  S.scale = newScale;
  const zi = document.getElementById('erZoomIndicator');
  if (zi) zi.textContent = Math.round(S.scale * 100) + '%';
  renderER();
}

function erResetView() {
  const S = ERDiagram.State;
  S.offsetX = 0; S.offsetY = 0; S.scale = 1;
  const zi = document.getElementById('erZoomIndicator');
  if (zi) zi.textContent = '100%';
  renderER();
}

function erFitView() {
  const S = ERDiagram.State;
  if (S.tables.length === 0) return;

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [, pos] of S.tablePositions) {
    minX = Math.min(minX, pos.x);
    minY = Math.min(minY, pos.y);
    maxX = Math.max(maxX, pos.x + pos.w);
    maxY = Math.max(maxY, pos.y + pos.h);
  }

  const panelRight = document.getElementById('erPanelRight');
  if (!panelRight) return;
  const rect = panelRight.getBoundingClientRect();
  const padding = 60;
  const contentW = maxX - minX + padding * 2;
  const contentH = maxY - minY + padding * 2;

  const scaleX = rect.width / contentW;
  const scaleY = rect.height / contentH;
  S.scale = Math.min(scaleX, scaleY, 1.5);
  S.offsetX = (rect.width - contentW * S.scale) / 2 - minX * S.scale + padding * S.scale;
  S.offsetY = (rect.height - contentH * S.scale) / 2 - minY * S.scale + padding * S.scale;

  const zi = document.getElementById('erZoomIndicator');
  if (zi) zi.textContent = Math.round(S.scale * 100) + '%';
  renderER();
}

function erHandleHover(e) {
  const S = ERDiagram.State;
  const R = ERDiagram.RENDER;
  const { worldX, worldY } = erScreenToWorld(e.clientX, e.clientY);

  for (const table of S.tables) {
    const pos = S.tablePositions.get(table.name);
    if (!pos) continue;
    if (worldX >= pos.x && worldX <= pos.x + pos.w &&
        worldY >= pos.y + R.headerHeight && worldY <= pos.y + pos.h) {
      const colIdx = Math.floor((worldY - pos.y - R.headerHeight) / R.rowHeight);
      if (colIdx >= 0 && colIdx < table.columns.length) {
        erShowTooltip(e.clientX, e.clientY, table, table.columns[colIdx]);
        return;
      }
    }
  }
  const tt = document.getElementById('erTooltip');
  if (tt) tt.style.display = 'none';
}

function erShowTooltip(mx, my, table, col) {
  const tooltip = document.getElementById('erTooltip');
  if (!tooltip) return;

  let html = `<div class="tt-title">${table.name}.${col.name}</div>`;
  html += `<div class="tt-row"><span class="tt-label">Tipo:</span> <span class="tt-value">${col.type}</span></div>`;

  const flags = [];
  if (col.pk) flags.push('PRIMARY KEY');
  if (col.fk) flags.push(`FK → ${col.fk.table}(${col.fk.column})`);
  if (col.unique) flags.push('UNIQUE');
  if (col.notNull) flags.push('NOT NULL');
  if (col.autoIncrement) flags.push('AUTO INCREMENT');
  if (flags.length) html += `<div class="tt-row"><span class="tt-label">Constraints:</span> <span class="tt-value">${flags.join(', ')}</span></div>`;
  if (col.defaultVal) html += `<div class="tt-row"><span class="tt-label">Default:</span> <span class="tt-value">${col.defaultVal}</span></div>`;
  if (col.check) html += `<div class="tt-row"><span class="tt-label">Check:</span> <span class="tt-value">${col.check}</span></div>`;

  tooltip.innerHTML = html;
  tooltip.style.display = 'block';
  tooltip.style.left = (mx + 15) + 'px';
  tooltip.style.top = (my + 15) + 'px';

  const tr = tooltip.getBoundingClientRect();
  if (tr.right > window.innerWidth) tooltip.style.left = (mx - tr.width - 10) + 'px';
  if (tr.bottom > window.innerHeight) tooltip.style.top = (my - tr.height - 10) + 'px';
}
