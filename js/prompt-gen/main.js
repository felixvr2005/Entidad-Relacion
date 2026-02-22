// ===================================================================
// PROMPT GENERATOR MODULE — Chatbot interface + template/AI modes
// ===================================================================

const PromptGen = {
  messagesHistory: [],
  activeCategory: 'all',
  mode: 'ai', // 'ai' or 'template'
  isGenerating: false,
  _handlers: null,

  init() {
    this._handlers = {};
    this.messagesHistory = [];
    this.activeCategory = 'all';
    this.isGenerating = false;

    // Check API key and set mode
    if (!GroqAPI.isConfigured()) {
      this.mode = 'template';
    }

    this._bindEvents();
    this._renderCategories();
    this._updateModeButtons();
    this._showWelcome();
  },

  destroy() {
    if (this._handlers) {
      const input = document.getElementById('pgInput');
      if (input) {
        input.removeEventListener('keydown', this._handlers.inputKeydown);
        input.removeEventListener('input', this._handlers.inputAutoResize);
      }
      const sendBtn = document.getElementById('pgSendBtn');
      if (sendBtn) sendBtn.removeEventListener('click', this._handlers.send);

      const clearBtn = document.getElementById('pgClearChat');
      if (clearBtn) clearBtn.removeEventListener('click', this._handlers.clear);

      document.querySelectorAll('.pg-mode-btn').forEach(btn => {
        btn.removeEventListener('click', this._handlers.modeSwitch);
      });
    }
    this._handlers = null;
  },

  _bindEvents() {
    const input = document.getElementById('pgInput');
    const sendBtn = document.getElementById('pgSendBtn');
    const clearBtn = document.getElementById('pgClearChat');

    // Send on click
    this._handlers.send = () => this._handleSend();
    if (sendBtn) sendBtn.addEventListener('click', this._handlers.send);

    // Send on Enter (shift+enter for newline)
    this._handlers.inputKeydown = (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this._handleSend();
      }
    };
    if (input) input.addEventListener('keydown', this._handlers.inputKeydown);

    // Auto resize textarea
    this._handlers.inputAutoResize = () => {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 140) + 'px';
    };
    if (input) input.addEventListener('input', this._handlers.inputAutoResize);

    // Clear chat
    this._handlers.clear = () => {
      this.messagesHistory = [];
      this._showWelcome();
    };
    if (clearBtn) clearBtn.addEventListener('click', this._handlers.clear);

    // Mode toggle
    this._handlers.modeSwitch = (e) => {
      const mode = e.currentTarget.dataset.mode;
      if (mode === 'ai' && !GroqAPI.isConfigured()) {
        showToast('Configura tu API Key de Groq primero (⚙️ en el menú principal).', 'error', 4000);
        return;
      }
      this.mode = mode;
      this._updateModeButtons();
    };
    document.querySelectorAll('.pg-mode-btn').forEach(btn => {
      btn.addEventListener('click', this._handlers.modeSwitch);
    });

    // Category clicks
    document.querySelectorAll('.pg-category').forEach(cat => {
      cat.addEventListener('click', () => {
        this.activeCategory = cat.dataset.category;
        this._renderCategories();
      });
    });

    // Suggestion clicks
    document.querySelectorAll('.pg-suggestion').forEach(sug => {
      sug.addEventListener('click', () => {
        const input = document.getElementById('pgInput');
        if (input) {
          input.value = sug.dataset.text;
          input.dispatchEvent(new Event('input'));
          this._handleSend();
        }
      });
    });
  },

  _renderCategories() {
    document.querySelectorAll('.pg-category').forEach(cat => {
      cat.classList.toggle('active', cat.dataset.category === this.activeCategory);
    });
  },

  _updateModeButtons() {
    document.querySelectorAll('.pg-mode-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === this.mode);
    });
    const hint = document.getElementById('pgInputHint');
    if (hint) {
      hint.textContent = this.mode === 'ai'
        ? 'Modo IA · Groq (Llama 3.3 70B) genera respuestas ultra-rápidas'
        : 'Modo Plantillas · Genera prompts profesionales sin API';
    }
  },

  _showWelcome() {
    const messages = document.getElementById('pgMessages');
    if (!messages) return;
    messages.innerHTML = `
      <div class="pg-welcome">
        <div class="pg-welcome-icon">🚀</div>
        <h2>Generador de Prompts Pro</h2>
        <p>Describe lo que necesitas y generaré un prompt profesional, un plan de tareas o un texto listo para usar. Selecciona una categoría o escribe directamente.</p>
        <div class="pg-suggestions">
          <div class="pg-suggestion" data-text="Necesito crear una aplicación web de gestión de inventarios con React y Node.js">
            <span class="pg-suggestion-icon">💻</span>
            Plan de implementación para app web
          </div>
          <div class="pg-suggestion" data-text="Escribe un artículo profesional sobre inteligencia artificial en la educación">
            <span class="pg-suggestion-icon">📝</span>
            Artículo sobre IA en educación
          </div>
          <div class="pg-suggestion" data-text="Genera una estrategia de marketing digital completa para una tienda de ropa online">
            <span class="pg-suggestion-icon">📊</span>
            Estrategia de marketing digital
          </div>
          <div class="pg-suggestion" data-text="Explícame cómo funciona Docker y Kubernetes de forma simple">
            <span class="pg-suggestion-icon">🎓</span>
            Explicación de Docker y K8s
          </div>
        </div>
      </div>
    `;

    // Re-bind suggestion clicks
    messages.querySelectorAll('.pg-suggestion').forEach(sug => {
      sug.addEventListener('click', () => {
        const input = document.getElementById('pgInput');
        if (input) {
          input.value = sug.dataset.text;
          input.dispatchEvent(new Event('input'));
          this._handleSend();
        }
      });
    });
  },

  async _handleSend() {
    if (this.isGenerating) return;

    const input = document.getElementById('pgInput');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;

    // Clear input
    input.value = '';
    input.style.height = 'auto';

    // Clear welcome if present
    const welcome = document.querySelector('.pg-welcome');
    if (welcome) welcome.remove();

    // Add user message
    this._addMessage('user', text);
    this.messagesHistory.push({ role: 'user', content: text });

    if (this.mode === 'template') {
      this._handleTemplateMode(text);
    } else {
      await this._handleAIMode(text);
    }
  },

  _handleTemplateMode(text) {
    const category = this.activeCategory === 'all' ? null : this.activeCategory;
    const result = generateFromTemplate(text, category);

    const response = `### 🎯 Prompt Generado — *${result.templateName}*

El siguiente prompt ha sido optimizado profesionalmente para obtener la mejor respuesta posible:

\`\`\`
${result.prompt}
\`\`\`

---

**💡 Consejo**: Copia el prompt anterior y úsalo en cualquier modelo de IA (ChatGPT, Claude, Gemini, Groq) para obtener resultados profesionales. Puedes ajustar los detalles específicos según tu caso.`;

    this._addMessage('ai', response);
    this.messagesHistory.push({ role: 'assistant', content: response });
  },

  async _handleAIMode(text) {
    this.isGenerating = true;
    this._setSendEnabled(false);

    // Add typing indicator
    const msgEl = this._addMessage('ai', '', true);
    const contentEl = msgEl.querySelector('.pg-msg-content');

    let fullText = '';

    await GroqAPI.chat(
      this.messagesHistory,
      // onChunk
      (chunk, accumulated) => {
        fullText = accumulated;
        if (contentEl) {
          contentEl.innerHTML = this._renderMarkdown(accumulated) + this._getCopyButton();
        }
        this._scrollToBottom();
      },
      // onDone
      (finalText) => {
        this.messagesHistory.push({ role: 'assistant', content: finalText });
        if (contentEl) {
          contentEl.innerHTML = this._renderMarkdown(finalText) + this._getCopyButton();
          this._bindCopyButtons(contentEl);
        }
        this.isGenerating = false;
        this._setSendEnabled(true);
        this._scrollToBottom();
      },
      // onError
      (error) => {
        if (contentEl) {
          contentEl.innerHTML = `<span style="color: var(--accent-red);">⚠️ ${error}</span>`;
        }
        this.isGenerating = false;
        this._setSendEnabled(true);
        showToast(error, 'error', 5000);
      }
    );
  },

  _addMessage(role, content, isStreaming = false) {
    const messages = document.getElementById('pgMessages');
    if (!messages) return null;

    const msg = document.createElement('div');
    msg.className = `pg-message ${role}`;

    const avatar = role === 'user' ? '👤' : '🤖';
    const renderedContent = content ? this._renderMarkdown(content) : (isStreaming ? '<div class="pg-typing"><div class="pg-typing-dot"></div><div class="pg-typing-dot"></div><div class="pg-typing-dot"></div></div>' : '');
    const copyBtn = role === 'ai' && content ? this._getCopyButton() : '';

    msg.innerHTML = `
      <div class="pg-msg-avatar">${avatar}</div>
      <div class="pg-msg-content">${renderedContent}${copyBtn}</div>
    `;

    messages.appendChild(msg);

    if (role === 'ai' && content) {
      this._bindCopyButtons(msg.querySelector('.pg-msg-content'));
    }

    this._scrollToBottom();
    return msg;
  },

  _getCopyButton() {
    return '<button class="pg-msg-copy" title="Copiar">📋</button>';
  },

  _bindCopyButtons(container) {
    if (!container) return;
    container.querySelectorAll('.pg-msg-copy').forEach(btn => {
      btn.addEventListener('click', () => {
        // Get text content, excluding the copy button itself
        const clone = container.cloneNode(true);
        clone.querySelectorAll('.pg-msg-copy').forEach(b => b.remove());
        const text = clone.textContent.trim();
        navigator.clipboard.writeText(text).then(() => {
          btn.textContent = '✅';
          setTimeout(() => { btn.textContent = '📋'; }, 2000);
          showToast('Copiado al portapapeles.', 'success', 2000);
        });
      });
    });
  },

  _setSendEnabled(enabled) {
    const btn = document.getElementById('pgSendBtn');
    if (btn) btn.disabled = !enabled;
  },

  _scrollToBottom() {
    const messages = document.getElementById('pgMessages');
    if (messages) {
      requestAnimationFrame(() => {
        messages.scrollTop = messages.scrollHeight;
      });
    }
  },

  _renderMarkdown(text) {
    // Simple Markdown renderer
    let html = text
      // Code blocks (must be before inline code)
      .replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
        return `<pre><code>${this._escapeHtml(code.trim())}</code></pre>`;
      })
      // Inline code
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      // Headers
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h3>$1</h3>')
      .replace(/^# (.+)$/gm, '<h3>$1</h3>')
      // Bold
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      // Horizontal rule
      .replace(/^---$/gm, '<hr style="border: none; border-top: 1px solid var(--border-color); margin: 12px 0;">')
      // Unordered lists
      .replace(/^[-*] (.+)$/gm, '<li>$1</li>')
      // Ordered lists
      .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
      // Paragraphs (double newlines)
      .replace(/\n\n/g, '</p><p>')
      // Single newlines in non-code context
      .replace(/\n/g, '<br>');

    // Wrap consecutive <li> in <ul>
    html = html.replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>');
    // Clean up nested <ul> (merge adjacent)
    html = html.replace(/<\/ul>\s*<ul>/g, '');

    return `<p>${html}</p>`.replace(/<p>\s*<\/p>/g, '');
  },

  _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};
