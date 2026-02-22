// ===================================================================
// LAYOUT ENGINE — 6-phase hierarchical layout algorithm
// ===================================================================

function computeLayout(tables, relationships, measureCtx) {
  const positions = new Map();
  if (tables.length === 0) return positions;

  const paddingX = 80;
  const paddingY = 70;
  const gapX = 120;
  const gapY = 90;

  // ── Compute dimensions ──
  const dims = new Map();
  for (const t of tables) {
    const w = computeTableWidth(t, measureCtx);
    const h = ERDiagram.RENDER.headerHeight + t.columns.length * ERDiagram.RENDER.rowHeight + 8;
    dims.set(t.name, { w, h });
  }

  // ── Build dependency graph ──
  const children = new Map();
  const parents  = new Map();
  const allNames = new Set(tables.map(t => t.name));
  for (const t of tables) { children.set(t.name, []); parents.set(t.name, []); }

  for (const r of relationships) {
    if (!allNames.has(r.from.table) || !allNames.has(r.to.table)) continue;
    if (r.from.table === r.to.table) continue;
    children.get(r.to.table).push(r.from.table);
    parents.get(r.from.table).push(r.to.table);
  }

  // ── PHASE 1: Topological layer assignment ──
  const layer = new Map();
  const assigned = new Set();
  const layers = [];

  let currentLevel = tables.filter(t => parents.get(t.name).length === 0).map(t => t.name);
  if (currentLevel.length === 0) {
    const byRefs = [...tables].sort((a, b) => children.get(b.name).length - children.get(a.name).length);
    currentLevel = [byRefs[0].name];
  }

  while (currentLevel.length > 0) {
    currentLevel.sort((a, b) => children.get(b).length - children.get(a).length);
    layers.push([...currentLevel]);
    currentLevel.forEach(n => { assigned.add(n); layer.set(n, layers.length - 1); });

    const nextLevel = new Set();
    for (const name of currentLevel) {
      for (const child of children.get(name)) {
        if (assigned.has(child)) continue;
        const allParentsAssigned = parents.get(child).every(p => assigned.has(p));
        if (allParentsAssigned) nextLevel.add(child);
      }
    }
    currentLevel = [...nextLevel];
  }

  const orphans = tables.filter(t => !assigned.has(t.name)).map(t => t.name);
  if (orphans.length > 0) layers.push(orphans);

  // ── PHASE 2: Horizontal ordering (barycenter) ──
  for (let li = 1; li < layers.length; li++) {
    const prevLayer = layers[li - 1];
    layers[li].sort((a, b) => {
      const parentsA = parents.get(a).filter(p => prevLayer.includes(p));
      const parentsB = parents.get(b).filter(p => prevLayer.includes(p));
      const avgA = parentsA.length > 0 ? parentsA.reduce((s, p) => s + prevLayer.indexOf(p), 0) / parentsA.length : prevLayer.length / 2;
      const avgB = parentsB.length > 0 ? parentsB.reduce((s, p) => s + prevLayer.indexOf(p), 0) / parentsB.length : prevLayer.length / 2;
      return avgA - avgB;
    });
  }

  // ── PHASE 3: Position tables ──
  const layerWidths = layers.map(lr => {
    let w = 0;
    for (const name of lr) w += (dims.get(name)?.w || 250) + gapX;
    return w - gapX;
  });
  const maxLayerWidth = Math.max(...layerWidths);

  let y = paddingY;
  for (let li = 0; li < layers.length; li++) {
    const lr = layers[li];
    const lw = layerWidths[li];
    let x = paddingX + (maxLayerWidth - lw) / 2;
    let maxH = 0;
    for (const name of lr) {
      const dim = dims.get(name) || { w: 250, h: 200 };
      positions.set(name, { x: Math.round(x), y: Math.round(y), w: dim.w, h: dim.h });
      x += dim.w + gapX;
      maxH = Math.max(maxH, dim.h);
    }
    y += maxH + gapY;
  }

  // ── PHASE 4: Horizontal refinement ──
  for (let pass = 0; pass < 4; pass++) {
    for (let li = 1; li < layers.length; li++) {
      for (const name of layers[li]) {
        const pos = positions.get(name);
        const myParents = parents.get(name).filter(p => positions.has(p));
        if (myParents.length === 0) continue;
        const targetCx = myParents.reduce((s, p) => { const pp = positions.get(p); return s + pp.x + pp.w / 2; }, 0) / myParents.length;
        const myCx = pos.x + pos.w / 2;
        pos.x += (targetCx - myCx) * 0.5;
      }
    }
    for (let li = layers.length - 2; li >= 0; li--) {
      for (const name of layers[li]) {
        const pos = positions.get(name);
        const myChildren = children.get(name).filter(c => positions.has(c));
        if (myChildren.length === 0) continue;
        const targetCx = myChildren.reduce((s, c) => { const cp = positions.get(c); return s + cp.x + cp.w / 2; }, 0) / myChildren.length;
        const myCx = pos.x + pos.w / 2;
        pos.x += (targetCx - myCx) * 0.3;
      }
    }
  }

  // ── PHASE 5: Resolve overlaps ──
  for (const lr of layers) {
    const sorted = lr.map(n => ({ name: n, pos: positions.get(n) })).sort((a, b) => a.pos.x - b.pos.x);
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1].pos;
      const curr = sorted[i].pos;
      const minX = prev.x + prev.w + 50;
      if (curr.x < minX) curr.x = minX;
    }
  }

  // ── PHASE 6: Normalize ──
  let minX = Infinity, minY = Infinity;
  for (const [, pos] of positions) { minX = Math.min(minX, pos.x); minY = Math.min(minY, pos.y); }
  for (const [, pos] of positions) {
    pos.x = Math.round(pos.x + paddingX - minX);
    pos.y = Math.round(pos.y + paddingY - minY);
  }

  return positions;
}

function computeTableWidth(table, c) {
  c.font = `bold 13px "Segoe UI", system-ui, sans-serif`;
  let maxW = c.measureText(table.name).width + 60;
  c.font = `12px "Cascadia Code", "Fira Code", Consolas, monospace`;
  for (const col of table.columns) {
    const icons = getColumnIcons(col);
    const text = `${icons.join('')} ${col.name}  ${col.type}`;
    const w = c.measureText(text).width + 40;
    maxW = Math.max(maxW, w);
  }
  return Math.max(ERDiagram.RENDER.tableMinWidth, Math.min(ERDiagram.RENDER.tableMaxWidth, maxW + 30));
}

function getColumnIcons(col) {
  const icons = [];
  if (col.pk) icons.push('🔑');
  if (col.fk) icons.push('🔗');
  if (col.unique && !col.pk) icons.push('◆');
  return icons;
}
