/**
 * Librika - Libra AI & Coursera Interactive Engine
 * Handles real-time AI queries, conversational drawer, catalog filtering, and search.
 */

(function () {
  'use strict';

  // Global AI Conversation History State
  const conversationHistory = [];
  let isAiResponding = false;

  // Simple, safe client-side Markdown formatter
  function formatMarkdown(text) {
    if (!text) return '';
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Code blocks ```...```
    html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');

    // Inline code `...`
    html = html.replace(/`([^`]+)`/g, '<code style="background:#f1f5f9;padding:2px 6px;border-radius:4px;color:#0056D2;font-size:0.9em;">$1</code>');

    // Bold **...**
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // Italic *...*
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // Headers ### ...
    html = html.replace(/^### (.*$)/gim, '<h4 style="margin:8px 0 4px;color:#00255D;font-size:1.05rem;">$1</h4>');
    html = html.replace(/^## (.*$)/gim, '<h3 style="margin:10px 0 6px;color:#00255D;font-size:1.15rem;">$1</h3>');

    // Bullet lists - item
    html = html.replace(/^\s*-\s(.*)$/gim, '<li style="margin-bottom:4px;">$1</li>');
    html = html.replace(/(<li.*<\/li>)/s, '<ul style="margin:6px 0 6px 18px;padding:0;">$1</ul>');

    // Paragraphs
    html = html.replace(/\n\n/g, '</p><p style="margin:0 0 8px 0;">');
    html = '<p style="margin:0 0 8px 0;">' + html + '</p>';

    return html;
  }

  // ─────────────────────────────────────────────────────────────
  // 1. INLINE HERO LIBRA AI CONSOLE
  // ─────────────────────────────────────────────────────────────
  function initInlineLibra() {
    const form = document.getElementById('libraInlineForm');
    const input = document.getElementById('libraInlineInput');
    const liveBox = document.getElementById('libraLiveResponse');
    const liveBody = document.getElementById('libraLiveBody');
    const submitBtn = document.getElementById('libraSubmitBtn');

    if (!form || !input || !liveBox || !liveBody) return;

    async function handleInlineQuery(queryText) {
      const q = (queryText || input.value || '').trim();
      if (!q || isAiResponding) return;

      isAiResponding = true;
      liveBox.classList.add('visible');
      liveBody.innerHTML = `
        <div style="display:flex;align-items:center;gap:10px;padding:12px 0;">
          <div class="cr-live-dot" style="background:#F2D04B;width:10px;height:10px;"></div>
          <span style="font-style:italic;color:#e1eaff;">Libra AI is thinking and curating resources for you...</span>
        </div>
      `;
      if (submitBtn) submitBtn.disabled = true;

      // Scroll to response smoothly
      liveBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

      try {
        const res = await fetch('/api/libra/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: q,
            history: conversationHistory
          })
        });

        const data = await res.json();
        const reply = data.reply || "I'm ready to assist! Ask me anything about free courses, digital books, or library memberships.";

        conversationHistory.push({ role: 'user', content: q });
        conversationHistory.push({ role: 'assistant', content: reply });

        liveBody.innerHTML = formatMarkdown(reply);
        input.value = '';
      } catch (err) {
        console.error('Libra fetch error:', err);
        liveBody.innerHTML = `<p style="color:#ffb3b3;">Unable to connect to AI engine right now. Please check your connection or explore our catalog below.</p>`;
      } finally {
        isAiResponding = false;
        if (submitBtn) submitBtn.disabled = false;
      }
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      handleInlineQuery();
    });

    // Chip click handlers
    document.querySelectorAll('.cr-chip-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const text = btn.getAttribute('data-query') || btn.innerText;
        input.value = text;
        handleInlineQuery(text);
      });
    });
  }

  // ─────────────────────────────────────────────────────────────
  // 2. FLOATING LIBRA AI DRAWER / MODAL
  // ─────────────────────────────────────────────────────────────
  function initFloatingLibra() {
    const floatBtn = document.getElementById('libraFloatBtn');
    const modal = document.getElementById('libraModal');
    const closeBtn = document.getElementById('libraCloseBtn');
    const chatForm = document.getElementById('libraChatForm');
    const chatInput = document.getElementById('libraChatInput');
    const chatBody = document.getElementById('libraChatBody');

    if (!floatBtn || !modal) return;

    function openModal() {
      modal.classList.add('open');
      if (chatInput) chatInput.focus();
    }

    function closeModal() {
      modal.classList.remove('open');
    }

    floatBtn.addEventListener('click', openModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    // Handle floating chat submit
    if (chatForm && chatInput && chatBody) {
      chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const userText = chatInput.value.trim();
        if (!userText || isAiResponding) return;

        // Append User Bubble
        const userBubble = document.createElement('div');
        userBubble.className = 'cr-msg cr-msg-user';
        userBubble.textContent = userText;
        chatBody.appendChild(userBubble);
        chatInput.value = '';
        chatBody.scrollTop = chatBody.scrollHeight;

        // Append AI Placeholder Bubble
        const aiBubble = document.createElement('div');
        aiBubble.className = 'cr-msg cr-msg-libra';
        aiBubble.innerHTML = '<span style="color:#64748b;font-style:italic;">Libra is typing...</span>';
        chatBody.appendChild(aiBubble);
        chatBody.scrollTop = chatBody.scrollHeight;

        isAiResponding = true;

        try {
          const res = await fetch('/api/libra/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: userText,
              history: conversationHistory
            })
          });

          const data = await res.json();
          const reply = data.reply || "I am here to help you navigate courses and books on Librika.";

          conversationHistory.push({ role: 'user', content: userText });
          conversationHistory.push({ role: 'assistant', content: reply });

          aiBubble.innerHTML = formatMarkdown(reply);
        } catch (err) {
          aiBubble.innerHTML = `<span style="color:#e11d48;">Oops! Couldn't reach the AI tutor right now. Please try again.</span>`;
        } finally {
          isAiResponding = false;
          chatBody.scrollTop = chatBody.scrollHeight;
        }
      });
    }

    // Expose open function globally
    window.openLibraChat = function (initialPrompt) {
      openModal();
      if (initialPrompt && chatInput && chatForm) {
        chatInput.value = initialPrompt;
        chatForm.dispatchEvent(new Event('submit'));
      }
    };
  }

  // ─────────────────────────────────────────────────────────────
  // 3. COURSERA CATALOG TABS & FILTERING
  // ─────────────────────────────────────────────────────────────
  function initCatalogTabs() {
    const tabs = document.querySelectorAll('.cr-tab');
    const cards = document.querySelectorAll('.cr-card[data-category]');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const filter = tab.getAttribute('data-filter');

        cards.forEach(card => {
          const cat = card.getAttribute('data-category') || '';
          if (filter === 'all' || cat.includes(filter) || filter === cat) {
            card.style.display = 'flex';
          } else {
            card.style.display = 'none';
          }
        });
      });
    });
  }

  // ─────────────────────────────────────────────────────────────
  // 4. UNIVERSAL HEADER SEARCH
  // ─────────────────────────────────────────────────────────────
  function initUniversalSearch() {
    const searchInput = document.getElementById('crUniversalSearch');
    if (!searchInput) return;

    // Keyboard shortcut (Cmd+K or Ctrl+K)
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInput.focus();
      }
    });

    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      const cards = document.querySelectorAll('.cr-card');

      cards.forEach(card => {
        const text = card.textContent.toLowerCase();
        if (!q || text.includes(q)) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });
  }

  // ─────────────────────────────────────────────────────────────
  // INITIALIZATION ON DOM READY
  // ─────────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    initInlineLibra();
    initFloatingLibra();
    initCatalogTabs();
    initUniversalSearch();
  });

})();
