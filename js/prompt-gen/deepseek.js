// ===================================================================
// GROQ API CLIENT — OpenAI-compatible streaming client (ultra-fast)
// ===================================================================

const GroqAPI = {
  baseURL: 'https://api.groq.com/openai/v1/chat/completions',
  model: 'llama-3.3-70b-versatile',

  getApiKey() {
    return localStorage.getItem('groq_api_key') || '';
  },

  isConfigured() {
    return !!this.getApiKey();
  },

  async chat(messages, onChunk, onDone, onError) {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      onError('No hay API Key de Groq configurada. Ve a ⚙️ Configuración para agregarla.');
      return;
    }

    const systemPrompt = {
      role: 'system',
      content: `Eres un experto generador de prompts profesionales y planificador de tareas de clase mundial. Tu nombre es PromptPro AI. Powered by Groq.

TUAS CAPACIDADES:
- Generar prompts altamente optimizados para cualquier modelo de IA
- Crear planes de tareas detallados y accionables
- Escribir textos profesionales listos para usar
- Aplicar frameworks de prompt engineering (chain-of-thought, few-shot, role-play, RISEN, CO-STAR)
- Optimizar para máxima calidad, velocidad y rendimiento

REGLAS:
1. Siempre responde en el idioma del usuario
2. Usa formato Markdown con headers, listas y código cuando aplique
3. Sé específico, detallado y accionable - nunca genérico
4. Incluye ejemplos cuando sea posible
5. Si generas un prompt, explica por qué es efectivo
6. Si generas un plan, incluye estimaciones de tiempo y prioridades
7. Estructura toda respuesta de forma profesional y clara
8. Cuando generes un prompt, ponlo dentro de un bloque de código para fácil copiado

ESPECIALIDADES:
- Prompt engineering avanzado
- Planificación de proyectos
- Redacción profesional
- Análisis y estrategia
- Código y arquitectura de software
- Marketing y copywriting
- Educación y tutoriales`
    };

    try {
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [systemPrompt, ...messages],
          stream: true,
          temperature: 0.7,
          max_tokens: 4096
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.error?.message || `Error ${response.status}: ${response.statusText}`;
        onError(errorMsg);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === 'data: [DONE]') continue;
          if (!trimmed.startsWith('data: ')) continue;

          try {
            const json = JSON.parse(trimmed.slice(6));
            const content = json.choices?.[0]?.delta?.content;
            if (content) {
              fullText += content;
              onChunk(content, fullText);
            }
          } catch (e) {
            // Skip malformed JSON chunks
          }
        }
      }

      onDone(fullText);
    } catch (err) {
      if (err.name === 'AbortError') {
        onDone(fullText || '');
      } else {
        onError(`Error de conexión: ${err.message}`);
      }
    }
  }
};
