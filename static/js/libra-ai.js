/**
 * Librika - Modern AI Engine ("Libra") & Coursera Interactive Features
 * Elevates AI writing style with rich markdown tables, callout cards, status badges,
 * clickable follow-up chips, and smooth typing presentation.
 */

(function () {
  'use strict';

  // Global AI Conversation History State
  const conversationHistory = [];
  let isAiResponding = false;

  // ─────────────────────────────────────────────────────────────
  // MODERN AI MARKDOWN & VISUAL COMPONENT FORMATTER
  // ─────────────────────────────────────────────────────────────
  function formatModernAiResponse(rawText) {
    if (!rawText) return '';
    
    let text = rawText.trim();

    // 1. Parse Markdown Tables (| Col 1 | Col 2 | ...)
    text = text.replace(/((?:\|[^\n]+\|\r?\n)+)/g, function (tableMatch) {
      const lines = tableMatch.trim().split(/\r?\n/);
      if (lines.length < 2) return tableMatch;

      let html = '<div class="cr-ai-table-wrap"><table class="cr-ai-table">';
      
      lines.forEach((line, index) => {
        // Skip separator row |---|---|
        if (/^\|[\s\-:|]+\|$/.test(line.trim())) return;

        const cells = line.split('|').slice(1, -1);
        if (index === 0) {
          html += '<thead><tr>';
          cells.forEach(c => html += `<th>${c.trim()}</th>`);
          html += '</tr></thead><tbody>';
        } else {
          html += '<tr>';
          cells.forEach(c => html += `<td>${c.trim()}</td>`);
          html += '</tr>';
        }
      });

      html += '</tbody></table></div>';
      return '\n' + html + '\n';
    });

    // 2. Parse Callouts & Quotes (> 💡 ... or > ...)
    text = text.replace(/^>\s*(.+)$/gim, function (match, p1) {
      let icon = '💡';
      let content = p1;
      if (p1.includes('🎯')) icon = '🎯';
      else if (p1.includes('🚀')) icon = '🚀';
      else if (p1.includes('ℹ️') || p1.includes('Note')) icon = 'ℹ️';

      return `<div class="cr-ai-callout"><span class="cr-ai-callout-icon">${icon}</span><div class="cr-ai-callout-text">${content}</div></div>`;
    });

    // 3. Status Badges & Pill Tags ([100% FREE], [BEGINNER], [PRO], etc.)
    text = text.replace(/\[(100% FREE|FREE|FREE ACCESS)\]/gi, '<span class="cr-ai-badge green">$1</span>');
    text = text.replace(/\[(BEGINNER|INTERMEDIATE|ADVANCED)\]/gi, '<span class="cr-ai-badge blue">$1</span>');
    text = text.replace(/\[(CERTIFIED|ACCREDITED|VERIFIED)\]/gi, '<span class="cr-ai-badge gold">$1</span>');
    text = text.replace(/\[(PRO|ENTERPRISE|CAMPUS)\]/gi, '<span class="cr-ai-badge purple">$1</span>');
    text = text.replace(/\[⭐ ([^\]]+)\]/gi, '<span class="cr-ai-badge star">⭐ $1</span>');

    // 4. Section Headings (### 🌟 Title)
    text = text.replace(/^### (.*$)/gim, '<h4 class="cr-ai-section-title">$1</h4>');
    text = text.replace(/^## (.*$)/gim, '<h3 class="cr-ai-section-title lg">$1</h3>');

    // 5. Code blocks ```...``` and inline `code`
    text = text.replace(/```([\s\S]*?)```/g, '<div class="cr-ai-code-block"><pre><code>$1</code></pre></div>');
    text = text.replace(/`([^`]+)`/g, '<code class="cr-ai-inline-code">$1</code>');

    // 6. Bold & Italics
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // 7. Clickable Action Links [Text](url)
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="cr-ai-action-link">$1</a>');

    // 8. Interactive Follow-up Prompts ("..." within Try asking)
    text = text.replace(/(?:Try asking:|Try:)\s*(\"[^\"]+\"|\*\*[^\*]+\*\*)/gi, function (match, prompt) {
      const cleanPrompt = prompt.replace(/[\"\*]/g, '').trim();
      return `<div class="cr-ai-followup-container"><span style="font-size:0.85rem;color:var(--cr-gold);font-weight:700;">💬 Suggested Question:</span> <button type="button" class="cr-ai-followup-pill" onclick="window.askLibraDirect('${cleanPrompt.replace(/'/g, "\\'")}')">${cleanPrompt} →</button></div>`;
    });

    // 9. Bullet Lists (- item or 🔹 item)
    text = text.replace(/^[\s-]*[🔹•-]\s+(.*)$/gim, '<li class="cr-ai-li">$1</li>');
    text = text.replace(/((?:<li class="cr-ai-li">.*<\/li>\r?\n?)+)/g, '<ul class="cr-ai-ul">$1</ul>');

    // 10. Horizontal Rules
    text = text.replace(/^---$/gim, '<hr class="cr-ai-divider">');

    // 11. Paragraphs
    text = text.replace(/\n\n+/g, '</p><p class="cr-ai-p">');
    text = '<p class="cr-ai-p">' + text + '</p>';

    // Clean up empty tags
    text = text.replace(/<p class="cr-ai-p"><\/p>/g, '');

    return text;
  }

  // Smooth Typewriter presentation helper
  function streamFormattedHtml(containerElement, fullHtml, onComplete) {
    containerElement.innerHTML = '';
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = fullHtml;

    // Fast, responsive animated reveal
    containerElement.innerHTML = fullHtml;
    containerElement.classList.add('cr-ai-fade-in');
    if (onComplete) onComplete();
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
        <div style="display:flex;align-items:center;gap:12px;padding:16px 0;">
          <div class="cr-live-dot" style="background:#F2D04B;width:12px;height:12px;"></div>
          <span style="font-weight:600;color:#e1eaff;letter-spacing:0.3px;">Libra AI is thinking and formulating a structured guide...</span>
        </div>
      `;
      if (submitBtn) submitBtn.disabled = true;

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
        const rawReply = data.reply || "I am ready to help you discover courses and books on Librika.";

        conversationHistory.push({ role: 'user', content: q });
        conversationHistory.push({ role: 'assistant', content: rawReply });

        const formatted = formatModernAiResponse(rawReply);
        streamFormattedHtml(liveBody, formatted);
        input.value = '';
      } catch (err) {
        console.error('Libra fetch error:', err);
        liveBody.innerHTML = `<div class="cr-ai-callout"><span class="cr-ai-callout-icon">⚠️</span><div class="cr-ai-callout-text">Connection issue. Please explore the course and book catalog below or retry.</div></div>`;
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

    // Global direct query helper for clickable pills inside AI replies
    window.askLibraDirect = function (promptText) {
      if (input) {
        input.value = promptText;
        handleInlineQuery(promptText);
      } else {
        window.openLibraChat(promptText);
      }
    };
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
        aiBubble.innerHTML = `
          <div style="display:flex;align-items:center;gap:8px;">
            <span class="cr-live-dot" style="background:#0056D2;width:8px;height:8px;"></span>
            <span style="color:#555;font-weight:600;font-size:0.88rem;">Libra is writing...</span>
          </div>
        `;
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
          const rawReply = data.reply || "I am here to guide your learning on Librika.";

          conversationHistory.push({ role: 'user', content: userText });
          conversationHistory.push({ role: 'assistant', content: rawReply });

          aiBubble.innerHTML = formatModernAiResponse(rawReply);
        } catch (err) {
          aiBubble.innerHTML = `<span style="color:#D9381E;">Could not connect to AI engine. Please retry.</span>`;
        } finally {
          isAiResponding = false;
          chatBody.scrollTop = chatBody.scrollHeight;
        }
      });
    }

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
