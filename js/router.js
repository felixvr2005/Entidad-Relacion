// ===================================================================
// ROUTER — Hash-based view switching (no framework)
// ===================================================================

const Router = {
  views: ['landing', 'er', 'prompt'],
  currentView: null,

  init() {
    window.addEventListener('hashchange', () => this.navigate());
    this.navigate();
  },

  navigate(target) {
    if (target) {
      window.location.hash = target;
      return;
    }

    const hash = window.location.hash.replace('#', '') || 'landing';
    const viewName = this.views.includes(hash) ? hash : 'landing';

    // Hide all views
    this.views.forEach(v => {
      const el = document.getElementById(`view-${v}`);
      if (el) {
        el.classList.remove('active');
        el.style.display = 'none';
      }
    });

    // Destroy previous module
    if (this.currentView === 'er' && typeof ERDiagram !== 'undefined') {
      ERDiagram.destroy();
    }
    if (this.currentView === 'prompt' && typeof PromptGen !== 'undefined') {
      PromptGen.destroy();
    }

    // Show target view
    const targetEl = document.getElementById(`view-${viewName}`);
    if (targetEl) {
      targetEl.style.display = 'flex';
      targetEl.classList.add('active');
    }

    // Init target module
    if (viewName === 'er' && typeof ERDiagram !== 'undefined') {
      ERDiagram.init();
    }
    if (viewName === 'prompt' && typeof PromptGen !== 'undefined') {
      PromptGen.init();
    }

    // Update body overflow
    document.body.style.overflow = viewName === 'landing' ? 'hidden' : 'hidden';
    this.currentView = viewName;
  }
};

// Boot
document.addEventListener('DOMContentLoaded', () => {
  Router.init();

  // Landing card clicks
  document.querySelectorAll('[data-navigate]').forEach(el => {
    el.addEventListener('click', () => {
      Router.navigate(el.dataset.navigate);
    });
  });

  // Settings modal
  const settingsBtn = document.getElementById('btnSettings');
  const modal = document.getElementById('apiKeyModal');
  const modalClose = document.getElementById('modalClose');
  const modalSave = document.getElementById('modalSave');
  const apiKeyInput = document.getElementById('apiKeyInput');

  if (settingsBtn && modal) {
    settingsBtn.addEventListener('click', () => {
      modal.style.display = 'flex';
      apiKeyInput.value = localStorage.getItem('groq_api_key') || '';
    });

    modalClose.addEventListener('click', () => { modal.style.display = 'none'; });
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });

    modalSave.addEventListener('click', () => {
      const key = apiKeyInput.value.trim();
      if (key) {
        localStorage.setItem('groq_api_key', key);
        showToast('API Key de Groq guardada correctamente.', 'success', 3000);
      } else {
        localStorage.removeItem('groq_api_key');
        showToast('API Key eliminada.', 'info', 3000);
      }
      modal.style.display = 'none';
      updateApiStatus();
    });
  }

  updateApiStatus();
});

function updateApiStatus() {
  const hasKey = !!localStorage.getItem('groq_api_key');
  document.querySelectorAll('.api-dot').forEach(dot => {
    dot.className = `api-dot ${hasKey ? 'connected' : 'disconnected'}`;
  });
  document.querySelectorAll('.api-status-text').forEach(el => {
    el.textContent = hasKey ? 'API Groq conectada' : 'Sin API Key configurada';
  });
  document.querySelectorAll('.pg-api-badge').forEach(el => {
    el.className = `pg-api-badge ${hasKey ? 'connected' : 'disconnected'}`;
    el.textContent = hasKey ? '🔑 API Conectada' : '⚠️ Sin API';
  });
}
