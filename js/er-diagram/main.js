// ===================================================================
// ER DIAGRAM MODULE — Main entry point (init/destroy lifecycle)
// ===================================================================

const ERDiagram = {
  canvas: null,
  ctx: null,
  _handlers: null,
  _uiHandlers: null,
  _resizeObserver: null,

  State: {
    tables: [],
    relationships: [],
    offsetX: 0, offsetY: 0, scale: 1,
    isDragging: false, dragStartX: 0, dragStartY: 0,
    draggingTable: null, tableDragOffsetX: 0, tableDragOffsetY: 0,
    hoveredColumn: null,
    tablePositions: new Map(),
  },

  RENDER: {
    tablePadding: 0,
    headerHeight: 36,
    rowHeight: 26,
    tableMinWidth: 240,
    tableMaxWidth: 380,
    tableBorderRadius: 10,
    shadowBlur: 18,
    shadowColor: 'rgba(0,0,0,0.45)',
    fontFamily: '"Segoe UI", system-ui, sans-serif',
    fontMono: '"Cascadia Code", "Fira Code", Consolas, monospace',
    headerGradientStart: '#3b4880',
    headerGradientEnd: '#2d3562',
    headerText: '#e0e6ff',
    rowBg: '#1e2030',
    rowBgAlt: '#232740',
    rowText: '#b4bcd0',
    pkColor: '#e0af68',
    fkColor: '#7aa2f7',
    ukColor: '#9ece6a',
    nnColor: '#f7768e',
    typeColor: '#7dcfff',
    defaultColor: '#bb9af7',
    checkColor: '#ff9e64',
    borderColor: '#3b4261',
    lineColors: ['#7aa2f7','#9ece6a','#e0af68','#bb9af7','#f7768e','#7dcfff','#ff9e64','#73daca'],
    lineWidth: 2,
    gridColor: 'rgba(59,66,97,0.25)',
    gridSize: 30,
  },

  init() {
    this.canvas = document.getElementById('erCanvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    // Resize canvas
    this.resizeCanvas();
    this._resizeHandler = () => this.resizeCanvas();
    window.addEventListener('resize', this._resizeHandler);

    // Setup interaction (zoom, pan, drag, hover)
    setupERInteraction();

    // UI event handlers
    this._uiHandlers = {};

    // SQL Editor line count
    const editor = document.getElementById('erSqlEditor');
    this._uiHandlers.editorInput = () => {
      const lines = editor.value.split('\n').length;
      const el = document.getElementById('erLineCount');
      if (el) el.textContent = `Líneas: ${lines}`;
    };
    if (editor) editor.addEventListener('input', this._uiHandlers.editorInput);

    // Examples dropdown
    const btnExamples = document.getElementById('erBtnExamples');
    const dropdown = document.getElementById('erExamplesDropdown');
    this._uiHandlers.toggleExamples = (e) => { e.stopPropagation(); dropdown.classList.toggle('show'); };
    this._uiHandlers.closeDropdown = () => dropdown.classList.remove('show');
    if (btnExamples) btnExamples.addEventListener('click', this._uiHandlers.toggleExamples);
    document.addEventListener('click', this._uiHandlers.closeDropdown);

    if (dropdown) {
      dropdown.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', () => {
          const key = a.dataset.example;
          if (SQL_EXAMPLES[key] && editor) {
            editor.value = SQL_EXAMPLES[key];
            editor.dispatchEvent(new Event('input'));
            dropdown.classList.remove('show');
            showToast('Ejemplo cargado. Haz clic en "Generar Diagrama".', 'info', 3000);
          }
        });
      });
    }

    // Clear button
    const btnClear = document.getElementById('erBtnClear');
    this._uiHandlers.clear = () => {
      if (editor) { editor.value = ''; editor.dispatchEvent(new Event('input')); }
      this.State.tables = [];
      this.State.relationships = [];
      this.State.tablePositions.clear();
      const wm = document.getElementById('erWatermark');
      if (wm) wm.style.display = '';
      const sb = document.getElementById('erStatsBar');
      if (sb) sb.style.display = 'none';
      renderER();
    };
    if (btnClear) btnClear.addEventListener('click', this._uiHandlers.clear);

    // Generate button
    const btnGenerate = document.getElementById('erBtnGenerate');
    this._uiHandlers.generate = () => this.generateDiagram();
    if (btnGenerate) btnGenerate.addEventListener('click', this._uiHandlers.generate);

    // Ctrl+Enter
    this._uiHandlers.keydown = (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); this.generateDiagram(); }
    };
    if (editor) editor.addEventListener('keydown', this._uiHandlers.keydown);

    // Auto Layout
    const btnAutoLayout = document.getElementById('erBtnAutoLayout');
    this._uiHandlers.autoLayout = () => {
      if (this.State.tables.length === 0) { showToast('No hay tablas para reorganizar.', 'error'); return; }
      this.State.tablePositions = computeLayout(this.State.tables, this.State.relationships, this.ctx);
      erFitView();
      showToast('Layout reorganizado.', 'success', 2000);
    };
    if (btnAutoLayout) btnAutoLayout.addEventListener('click', this._uiHandlers.autoLayout);

    // Export PNG
    const btnExport = document.getElementById('erBtnExportPng');
    this._uiHandlers.exportPng = () => exportPng();
    if (btnExport) btnExport.addEventListener('click', this._uiHandlers.exportPng);

    // Fit View button
    const btnFit = document.getElementById('erBtnFitView');
    this._uiHandlers.fitView = () => erFitView();
    if (btnFit) btnFit.addEventListener('click', this._uiHandlers.fitView);

    // Resize handle
    const resizeHandle = document.getElementById('erResizeHandle');
    const panelLeft = document.getElementById('erPanelLeft');
    let isResizing = false;

    this._uiHandlers.resizeStart = (e) => { isResizing = true; resizeHandle.classList.add('active'); e.preventDefault(); };
    this._uiHandlers.resizeMove = (e) => {
      if (!isResizing) return;
      const newWidth = e.clientX;
      if (newWidth >= 320 && newWidth <= 600 && panelLeft) { panelLeft.style.width = newWidth + 'px'; this.resizeCanvas(); }
    };
    this._uiHandlers.resizeEnd = () => { isResizing = false; if (resizeHandle) resizeHandle.classList.remove('active'); };

    if (resizeHandle) resizeHandle.addEventListener('mousedown', this._uiHandlers.resizeStart);
    document.addEventListener('mousemove', this._uiHandlers.resizeMove);
    document.addEventListener('mouseup', this._uiHandlers.resizeEnd);

    // Initial render
    setTimeout(() => { this.resizeCanvas(); renderER(); }, 50);
  },

  destroy() {
    window.removeEventListener('resize', this._resizeHandler);
    teardownERInteraction();

    const editor = document.getElementById('erSqlEditor');
    const h = this._uiHandlers;
    if (!h) return;

    if (editor) {
      editor.removeEventListener('input', h.editorInput);
      editor.removeEventListener('keydown', h.keydown);
    }

    const btnExamples = document.getElementById('erBtnExamples');
    if (btnExamples) btnExamples.removeEventListener('click', h.toggleExamples);
    document.removeEventListener('click', h.closeDropdown);

    const btnClear = document.getElementById('erBtnClear');
    if (btnClear) btnClear.removeEventListener('click', h.clear);

    const btnGenerate = document.getElementById('erBtnGenerate');
    if (btnGenerate) btnGenerate.removeEventListener('click', h.generate);

    const btnAutoLayout = document.getElementById('erBtnAutoLayout');
    if (btnAutoLayout) btnAutoLayout.removeEventListener('click', h.autoLayout);

    const btnExport = document.getElementById('erBtnExportPng');
    if (btnExport) btnExport.removeEventListener('click', h.exportPng);

    const btnFit = document.getElementById('erBtnFitView');
    if (btnFit) btnFit.removeEventListener('click', h.fitView);

    const resizeHandle = document.getElementById('erResizeHandle');
    if (resizeHandle) resizeHandle.removeEventListener('mousedown', h.resizeStart);
    document.removeEventListener('mousemove', h.resizeMove);
    document.removeEventListener('mouseup', h.resizeEnd);

    this._uiHandlers = null;
  },

  resizeCanvas() {
    const panelRight = document.getElementById('erPanelRight');
    if (!panelRight || !this.canvas || !this.ctx) return;
    const rect = panelRight.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    this.canvas.width = rect.width * window.devicePixelRatio;
    this.canvas.height = rect.height * window.devicePixelRatio;
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
    this.ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    renderER();
  },

  generateDiagram() {
    const editor = document.getElementById('erSqlEditor');
    if (!editor) return;
    const sql = editor.value.trim();
    if (!sql) { showToast('Por favor, introduce código SQL primero.', 'error'); return; }

    const statusText = document.getElementById('erStatusText');
    if (statusText) statusText.textContent = 'Parseando SQL...';

    try {
      const result = parseSQL(sql);
      if (result.tables.length === 0) {
        showToast('No se encontraron sentencias CREATE TABLE en el SQL proporcionado.', 'error');
        if (statusText) statusText.textContent = 'Error: sin tablas';
        return;
      }

      this.State.tables = result.tables;
      this.State.relationships = result.relationships;
      this.State.tablePositions = computeLayout(result.tables, result.relationships, this.ctx);

      const totalCols = result.tables.reduce((sum, t) => sum + t.columns.length, 0);
      const el = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
      el('erStatTables', result.tables.length);
      el('erStatRelations', result.relationships.length);
      el('erStatColumns', totalCols);
      const sb = document.getElementById('erStatsBar');
      if (sb) sb.style.display = 'flex';

      const wm = document.getElementById('erWatermark');
      if (wm) wm.style.display = 'none';

      erFitView();

      if (statusText) statusText.textContent = `✓ ${result.tables.length} tablas, ${result.relationships.length} relaciones, ${totalCols} columnas`;
      showToast(`Diagrama generado: ${result.tables.length} tablas, ${result.relationships.length} relaciones`, 'success', 3000);
      showDenadaPopup();
    } catch (err) {
      console.error('Parse error:', err);
      showToast(`Error al parsear SQL: ${err.message}`, 'error');
      if (statusText) statusText.textContent = 'Error de parseo';
    }
  }
};

function showDenadaPopup() {
  const overlay = document.createElement('div');
  overlay.className = 'denada-overlay';
  overlay.innerHTML = `
    <div class="denada-box">
      <div class="denada-sparkle">✨</div>
      <div class="denada-text">DE NADA CHICOS</div>
      <div class="denada-sub">— diagrama generado con éxito —</div>
      <div class="denada-loading">
        <div class="denada-loading-bar"><div class="denada-loading-fill"></div></div>
        <span>CARGANDO...</span>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', () => {
    overlay.style.transition = 'opacity 0.3s ease';
    overlay.style.opacity = '0';
    setTimeout(() => overlay.remove(), 300);
  });
  setTimeout(() => {
    overlay.style.transition = 'opacity 0.4s ease';
    overlay.style.opacity = '0';
    setTimeout(() => overlay.remove(), 400);
  }, 3000);
}
