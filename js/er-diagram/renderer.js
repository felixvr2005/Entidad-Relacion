// ===================================================================
// CANVAS RENDERER — Unified drawing functions (canvas + export)
// ===================================================================

function renderER() {
  const canvas = ERDiagram.canvas;
  const ctx = ERDiagram.ctx;
  const S = ERDiagram.State;
  const R = ERDiagram.RENDER;
  if (!canvas || !ctx) return;

  const w = canvas.width / window.devicePixelRatio;
  const h = canvas.height / window.devicePixelRatio;

  ctx.save();
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#16171f';
  ctx.fillRect(0, 0, w, h);

  drawGrid(ctx, w, h, S, R);
  ctx.translate(S.offsetX, S.offsetY);
  ctx.scale(S.scale, S.scale);

  drawRelationships(ctx, S, R);

  for (const table of S.tables) {
    const pos = S.tablePositions.get(table.name);
    if (pos) drawTable(ctx, table, pos, R);
  }

  ctx.restore();
}

function drawGrid(c, w, h, S, R) {
  const gs = R.gridSize;
  c.strokeStyle = R.gridColor;
  c.lineWidth = 0.5;
  const startX = S.offsetX % (gs * S.scale);
  const startY = S.offsetY % (gs * S.scale);
  c.beginPath();
  for (let x = startX; x < w; x += gs * S.scale) { c.moveTo(x, 0); c.lineTo(x, h); }
  for (let y = startY; y < h; y += gs * S.scale) { c.moveTo(0, y); c.lineTo(w, y); }
  c.stroke();
}

function drawTable(c, table, pos, R) {
  const { x, y, w } = pos;
  const h = R.headerHeight + table.columns.length * R.rowHeight + 8;
  pos.h = h;

  // Shadow
  c.save();
  c.shadowColor = R.shadowColor;
  c.shadowBlur = R.shadowBlur;
  c.shadowOffsetX = 3;
  c.shadowOffsetY = 5;
  c.fillStyle = R.rowBg;
  drawRoundRect(c, x, y, w, h, R.tableBorderRadius);
  c.fill();
  c.restore();

  // Border
  c.strokeStyle = R.borderColor;
  c.lineWidth = 1.5;
  drawRoundRect(c, x, y, w, h, R.tableBorderRadius);
  c.stroke();

  // Header shape
  c.save();
  c.beginPath();
  c.moveTo(x + R.tableBorderRadius, y);
  c.lineTo(x + w - R.tableBorderRadius, y);
  c.quadraticCurveTo(x + w, y, x + w, y + R.tableBorderRadius);
  c.lineTo(x + w, y + R.headerHeight);
  c.lineTo(x, y + R.headerHeight);
  c.lineTo(x, y + R.tableBorderRadius);
  c.quadraticCurveTo(x, y, x + R.tableBorderRadius, y);
  c.closePath();
  const grad = c.createLinearGradient(x, y, x + w, y + R.headerHeight);
  grad.addColorStop(0, R.headerGradientStart);
  grad.addColorStop(1, R.headerGradientEnd);
  c.fillStyle = grad;
  c.fill();
  c.restore();

  // Header text
  c.font = `bold 14px ${R.fontFamily}`;
  c.fillStyle = R.headerText;
  c.textBaseline = 'middle';
  c.textAlign = 'left';
  const headerText = (table.schema ? table.schema + '.' : '') + table.name;
  c.fillText('📋 ' + headerText, x + 12, y + R.headerHeight / 2);

  c.font = `10px ${R.fontFamily}`;
  c.fillStyle = 'rgba(255,255,255,0.4)';
  c.textAlign = 'right';
  c.fillText(`${table.columns.length} cols`, x + w - 10, y + R.headerHeight / 2);
  c.textAlign = 'left';

  // Separator
  c.strokeStyle = R.borderColor;
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(x, y + R.headerHeight);
  c.lineTo(x + w, y + R.headerHeight);
  c.stroke();

  // Columns
  for (let i = 0; i < table.columns.length; i++) {
    const col = table.columns[i];
    const rowY = y + R.headerHeight + i * R.rowHeight;

    if (i % 2 === 1) {
      c.fillStyle = R.rowBgAlt;
      if (i === table.columns.length - 1) {
        c.beginPath();
        c.moveTo(x, rowY); c.lineTo(x + w, rowY);
        c.lineTo(x + w, y + h - R.tableBorderRadius);
        c.quadraticCurveTo(x + w, y + h, x + w - R.tableBorderRadius, y + h);
        c.lineTo(x + R.tableBorderRadius, y + h);
        c.quadraticCurveTo(x, y + h, x, y + h - R.tableBorderRadius);
        c.lineTo(x, rowY); c.closePath(); c.fill();
      } else {
        c.fillRect(x + 1, rowY, w - 2, R.rowHeight);
      }
    }

    const textY = rowY + R.rowHeight / 2;
    let textX = x + 10;

    // Icons
    const icons = [];
    if (col.pk) icons.push({ text: '🔑', color: R.pkColor });
    if (col.fk) icons.push({ text: '🔗', color: R.fkColor });
    if (col.unique && !col.pk) icons.push({ text: '◆', color: R.ukColor });

    c.font = `12px ${R.fontFamily}`;
    c.textBaseline = 'middle';
    for (const icon of icons) { c.fillText(icon.text, textX, textY); textX += 18; }
    if (icons.length === 0) textX += 4;

    // Column name
    c.font = col.pk ? `bold 12px ${R.fontMono}` : `12px ${R.fontMono}`;
    c.fillStyle = col.pk ? R.pkColor : (col.fk ? R.fkColor : R.rowText);
    c.fillText(col.name, textX, textY);

    // Type & badges (right-aligned)
    c.font = `11px ${R.fontMono}`;
    c.fillStyle = R.typeColor;
    c.textAlign = 'right';

    let typeText = col.type;
    if (typeText.length > 22) typeText = typeText.substring(0, 20) + '…';
    let typeX = x + w - 10;

    // Badges
    const badges = [];
    if (col.notNull && !col.pk) badges.push({ text: 'NN', color: R.nnColor });
    if (col.autoIncrement) badges.push({ text: 'AI', color: R.defaultColor });
    if (col.defaultVal) badges.push({ text: 'D', color: R.defaultColor });
    if (col.check) badges.push({ text: 'CK', color: R.checkColor });

    c.font = `bold 9px ${R.fontFamily}`;
    for (let b = badges.length - 1; b >= 0; b--) {
      const badge = badges[b];
      const bw = c.measureText(badge.text).width + 8;
      const bx = typeX - bw;
      const by = textY - 7;

      c.fillStyle = badge.color + '22';
      c.strokeStyle = badge.color + '66';
      c.lineWidth = 1;
      drawRoundRect(c, bx, by, bw, 14, 3); c.fill();
      drawRoundRect(c, bx, by, bw, 14, 3); c.stroke();

      c.fillStyle = badge.color;
      c.textAlign = 'center';
      c.fillText(badge.text, bx + bw / 2, textY);
      typeX = bx - 5;
    }

    c.font = `11px ${R.fontMono}`;
    c.fillStyle = R.typeColor;
    c.textAlign = 'right';
    c.fillText(typeText, typeX, textY);
    c.textAlign = 'left';
  }
}

function drawRelationships(c, S, R) {
  for (let i = 0; i < S.relationships.length; i++) {
    const rel = S.relationships[i];
    const fromPos = S.tablePositions.get(rel.from.table);
    const toPos = S.tablePositions.get(rel.to.table);
    if (!fromPos || !toPos) continue;

    const fromTable = S.tables.find(t => t.name === rel.from.table);
    const toTable = S.tables.find(t => t.name === rel.to.table);
    if (!fromTable || !toTable) continue;

    const fromColIdx = fromTable.columns.findIndex(cc =>
      rel.from.columns.map(c => c.toLowerCase()).includes(cc.name.toLowerCase()));
    const toColIdx = toTable.columns.findIndex(cc =>
      rel.to.columns.map(c => c.toLowerCase()).includes(cc.name.toLowerCase()));

    const fromColY = fromPos.y + R.headerHeight + (fromColIdx >= 0 ? fromColIdx : 0) * R.rowHeight + R.rowHeight / 2;
    const toColY = toPos.y + R.headerHeight + (toColIdx >= 0 ? toColIdx : 0) * R.rowHeight + R.rowHeight / 2;

    const fromCenterX = fromPos.x + fromPos.w / 2;
    const toCenterX = toPos.x + toPos.w / 2;
    let fromX, toX, fromSide, toSide;

    if (fromCenterX < toCenterX) {
      fromX = fromPos.x + fromPos.w; toX = toPos.x; fromSide = 'right'; toSide = 'left';
    } else {
      fromX = fromPos.x; toX = toPos.x + toPos.w; fromSide = 'left'; toSide = 'right';
    }

    const color = R.lineColors[i % R.lineColors.length];
    c.strokeStyle = color;
    c.fillStyle = color;
    c.lineWidth = R.lineWidth;
    c.setLineDash([]);

    const cpOffset = Math.min(80, Math.abs(toX - fromX) * 0.4);
    const cp1x = fromSide === 'right' ? fromX + cpOffset : fromX - cpOffset;
    const cp2x = toSide === 'left' ? toX - cpOffset : toX + cpOffset;

    c.beginPath();
    c.moveTo(fromX, fromColY);
    c.bezierCurveTo(cp1x, fromColY, cp2x, toColY, toX, toColY);
    c.stroke();

    drawCrowsFoot(c, fromX, fromColY, fromSide, 'many', color);
    drawCrowsFoot(c, toX, toColY, toSide, 'one', color);
  }
}

function drawCrowsFoot(c, x, y, side, cardinality, color) {
  const dir = side === 'right' ? 1 : -1;
  const size = 12;
  c.strokeStyle = color;
  c.fillStyle = color;
  c.lineWidth = 2;

  if (cardinality === 'many') {
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + dir * size, y - size * 0.6); c.stroke();
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + dir * size, y); c.stroke();
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + dir * size, y + size * 0.6); c.stroke();
    c.beginPath(); c.moveTo(x + dir * (size + 3), y - size * 0.6); c.lineTo(x + dir * (size + 3), y + size * 0.6); c.stroke();
  } else {
    c.beginPath(); c.moveTo(x - dir * 3, y - 8); c.lineTo(x - dir * 3, y + 8); c.stroke();
    c.beginPath(); c.moveTo(x - dir * 7, y - 8); c.lineTo(x - dir * 7, y + 8); c.stroke();
  }
}

function drawRoundRect(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.lineTo(x + w - r, y);
  c.quadraticCurveTo(x + w, y, x + w, y + r);
  c.lineTo(x + w, y + h - r);
  c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  c.lineTo(x + r, y + h);
  c.quadraticCurveTo(x, y + h, x, y + h - r);
  c.lineTo(x, y + r);
  c.quadraticCurveTo(x, y, x + r, y);
  c.closePath();
}
