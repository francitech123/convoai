// ============================================
// AI MODULE - ChatGPT-like Interface
// ============================================

import { apiFetch, $id, setText, showToast, getToken, API_BASE } from './utils.js';

let aiConvId = null;
let aiThinkMode = false;
let aiWebSearch = false;
let aiIsLoading = false;
let aiMediaFile = null;
let aiMediaData = null;
let aiConversations = [];
let selectedConvId = null;

// ==================== CONVERSATION MANAGEMENT ====================
export async function loadAIConversations() {
  try {
    const data = await apiFetch('/ai/conversations');
    if (data.conversations && data.conversations.length > 0) {
      aiConversations = data.conversations;
      renderSidebarHistory();
    }
  } catch(e) {
    console.warn('Could not load conversations:', e);
  }
}

function renderSidebarHistory() {
  const container = $id('aiSidebarHistory');
  if (!container) return;
  
  if (aiConversations.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;padding:20px;color:var(--text-secondary);font-size:.75rem">
        <i class="fas fa-message" style="font-size:1.5rem;display:block;margin-bottom:8px;opacity:.3"></i>
        No conversations yet
      </div>
    `;
    return;
  }
  
  container.innerHTML = aiConversations.map(conv => `
    <div class="ai-history-item ${conv.id === selectedConvId ? 'active' : ''}" 
         onclick="window.aiLoadConversation('${conv.id}')">
      <span class="ai-history-icon"><i class="fas fa-comment"></i></span>
      <span class="ai-history-title">${escapeHtml(conv.title || 'New Chat')}</span>
      <button class="ai-history-delete" onclick="event.stopPropagation();window.aiDeleteConversation('${conv.id}')">
        <i class="fas fa-trash"></i>
      </button>
    </div>
  `).join('');
}

export async function aiNewChat() {
  try {
    const data = await apiFetch('/ai/new-conversation', { method: 'POST' });
    if (data.conversationId) {
      aiConvId = data.conversationId;
      selectedConvId = aiConvId;
      await loadAIConversations();
      clearAIMessages();
      showToast('New conversation started', 'success');
    }
  } catch(e) {
    showToast('Failed to create new chat', 'error');
  }
}

export async function aiLoadConversation(id) {
  try {
    const data = await apiFetch('/ai/conversation/' + id);
    if (data.messages && data.messages.length > 0) {
      aiConvId = id;
      selectedConvId = id;
      const container = $id('aiMessages');
      container.innerHTML = '';
      data.messages.forEach(msg => {
        if (msg.role === 'user') {
          addAIMessage(msg.content, true);
        } else {
          addAIMessage(msg.content, false);
        }
      });
      await loadAIConversations();
    }
  } catch(e) {
    showToast('Failed to load conversation', 'error');
  }
}

export async function aiDeleteConversation(id) {
  if (!confirm('Delete this conversation?')) return;
  try {
    await apiFetch('/ai/conversation/' + id, { method: 'DELETE' });
    if (selectedConvId === id) {
      selectedConvId = null;
      aiConvId = null;
      clearAIMessages();
    }
    await loadAIConversations();
    showToast('Conversation deleted', 'info');
  } catch(e) {
    showToast('Failed to delete', 'error');
  }
}

function clearAIMessages() {
  const container = $id('aiMessages');
  if (!container) return;
  container.innerHTML = `
    <div style="text-align:center;padding:40px 20px;color:var(--text-secondary)">
      <span class="nox-avatar" style="font-size:3rem;display:block;margin:0 auto 12px">🦉</span>
      <h2 style="font-size:1.3rem;margin-bottom:4px;color:var(--text)">Nox</h2>
      <p style="font-size:.85rem">Your Study Companion · <em style="color:#7c3aed">Nox Knows</em></p>
      <p style="font-size:.8rem;margin-top:8px;color:var(--text-secondary)">Ask me anything about your courses, past questions, or study strategies!</p>
      <div class="quick-chips" style="margin-top:12px">
        <div class="quick-chip" onclick="window.aiQuickAsk('Explain quantum computing in simple terms')">⚛️ Learn Concept</div>
        <div class="quick-chip" onclick="window.aiQuickAsk('Solve: Find the derivative of f(x) = 3x² + 2x - 5')">📐 Solve Math</div>
        <div class="quick-chip" onclick="window.aiQuickAsk('Create a product card with HTML, CSS')">💻 Code Help</div>
        <div class="quick-chip" onclick="window.aiQuickAsk('What are the best study strategies for exams?')">💡 Study Tips</div>
      </div>
    </div>
  `;
}

// ==================== AI FUNCTIONS ====================
export function aiToggleThinkMode() {
  aiThinkMode = !aiThinkMode;
  const btn = $id('aiThinkBtn');
  if (btn) btn.classList.toggle('active');
  showToast(aiThinkMode ? '🧠 Deep Thinking ON' : 'Deep Thinking OFF', 'info');
}

export function aiToggleWebSearch() {
  aiWebSearch = !aiWebSearch;
  const btn = $id('aiWebSearchBtn');
  if (btn) btn.classList.toggle('active');
  showToast(aiWebSearch ? '🌐 Web Search ON' : 'Web Search OFF', 'info');
}

export function aiHandleFileUpload(input) {
  const file = input.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    aiMediaData = e.target.result;
    aiMediaFile = file;
    const preview = $id('aiMediaPreview');
    const content = $id('aiMediaContent');
    if (preview) preview.style.display = 'block';
    if (content) {
      if (file.type.startsWith('image/')) {
        content.innerHTML = `<img src="${aiMediaData}" style="max-width:100%;max-height:60px;border-radius:6px"><p style="font-size:0.6rem;margin-top:4px;color:var(--text-secondary)">${file.name}</p>`;
      } else {
        content.innerHTML = `<div style="display:flex;align-items:center;gap:8px;color:var(--text-secondary)"><i class="fas fa-file"></i> 📎 ${file.name}</div>`;
      }
    }
    showToast(`📎 "${file.name}" added! Nox will analyze it.`, 'success');
  };
  reader.readAsDataURL(file);
}

export function aiRemoveMedia() {
  aiMediaFile = null;
  aiMediaData = null;
  const preview = $id('aiMediaPreview');
  const content = $id('aiMediaContent');
  if (preview) preview.style.display = 'none';
  if (content) content.innerHTML = '';
  const fileInput = $id('aiFileInput');
  if (fileInput) fileInput.value = '';
}

export function addAIMessage(content, isUser) {
  const container = $id('aiMessages');
  if (!container) return;
  
  // Remove welcome screen if present
  const welcome = container.querySelector('.ai-welcome');
  if (welcome) welcome.remove();
  
  const div = document.createElement('div');
  div.className = 'ai-message ' + (isUser ? 'user' : 'bot');
  
  if (isUser) {
    div.innerHTML = `
      <div class="ai-bubble user-bubble">
        <div class="ai-text">${escapeHtml(content)}</div>
        <div class="ai-time">Just now</div>
      </div>
    `;
  } else {
    div.innerHTML = `
      <div class="ai-bubble bot-bubble">
        <div class="ai-avatar"><span>🦉</span></div>
        <div style="flex:1;min-width:0">
          <div class="ai-sender">Nox</div>
          <div class="ai-text">${formatAIResponse(content)}</div>
          <div class="ai-actions">
            <button class="ai-action-btn" onclick="window.aiCopyMessage(this)"><i class="fas fa-copy"></i> Copy</button>
            <button class="ai-action-btn" onclick="window.aiSpeakMessage(this)"><i class="fas fa-volume-up"></i> Speak</button>
            <button class="ai-action-btn" onclick="window.aiRegenerate()"><i class="fas fa-rotate"></i> Regenerate</button>
          </div>
          <div class="ai-time">Just now</div>
        </div>
      </div>
    `;
  }
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  
  // Trigger MathJax
  if (window.MathJax) {
    MathJax.typesetPromise([div]).catch(console.error);
  }
}

function showAITyping() {
  const container = $id('aiMessages');
  if (!container) return null;
  const id = 'ai_typing_' + Date.now();
  const div = document.createElement('div');
  div.className = 'ai-message bot';
  div.id = id;
  div.innerHTML = `
    <div class="ai-bubble bot-bubble">
      <div class="ai-avatar"><span>🦉</span></div>
      <div style="flex:1">
        <div class="ai-sender">Nox</div>
        <div class="ai-typing">
          <span></span><span></span><span></span>
          <span style="margin-left:8px;color:var(--text-secondary);font-size:.8rem">thinking...</span>
        </div>
      </div>
    </div>
  `;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  return id;
}

function removeAITyping(id) {
  if (!id) return;
  const el = $id(id);
  if (el) el.remove();
}

export async function aiSendMessage() {
  if (aiIsLoading) return;
  
  const input = $id('aiInput');
  if (!input) return;
  const message = input.value.trim();
  
  if (!message && !aiMediaData) {
    showToast('Please enter a message or upload a file', 'error');
    return;
  }
  
  const displayMsg = message || (aiMediaFile ? `📎 Analyzing: ${aiMediaFile.name}` : '');
  addAIMessage(displayMsg, true);
  input.value = '';
  input.style.height = 'auto';
  
  const sendBtn = $id('aiSendBtn');
  if (sendBtn) {
    sendBtn.disabled = true;
    sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
  }
  
  aiIsLoading = true;
  const typingId = showAITyping();
  
  try {
    let response = null;
    
    if (aiMediaData) {
      const formData = new FormData();
      const blob = await fetch(aiMediaData).then(r => r.blob());
      formData.append('file', blob, aiMediaFile?.name || 'upload');
      formData.append('question', message || 'Analyze this file');
      if (aiThinkMode) formData.append('thinkMode', 'true');
      
      const token = getToken();
      const res = await fetch(API_BASE + '/ai/analyze', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token },
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        response = data.analysis;
      } else {
        throw new Error(data.error || 'File analysis failed');
      }
      aiRemoveMedia();
    } else {
      const data = await apiFetch('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: message,
          conversationId: aiConvId,
          thinkMode: aiThinkMode,
          webSearch: aiWebSearch
        })
      });
      
      if (data.success) {
        if (!aiConvId && data.conversationId) {
          aiConvId = data.conversationId;
          selectedConvId = aiConvId;
          await loadAIConversations();
        }
        response = data.response;
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    }
    
    removeAITyping(typingId);
    if (response) {
      addAIMessage(response, false);
    } else {
      addAIMessage('⚠️ Nox didn\'t catch that. Please try again.', false);
    }
  } catch (error) {
    removeAITyping(typingId);
    console.error('Nox AI Error:', error);
    addAIMessage('🦉 ' + (error.message || 'Nox is having trouble. Please try again.'), false);
  }
  
  aiIsLoading = false;
  if (sendBtn) {
    sendBtn.disabled = false;
    sendBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
  }
  if (input) input.focus();
}

export function aiQuickAsk(question) {
  const input = $id('aiInput');
  if (input) {
    input.value = question;
    aiSendMessage();
  }
}

export function aiCopyMessage(btn) {
  const bubble = btn.closest('.ai-bubble');
  if (!bubble) return;
  const textEl = bubble.querySelector('.ai-text');
  if (!textEl) return;
  const text = textEl.innerText;
  navigator.clipboard.writeText(text);
  showToast('📋 Copied to clipboard!', 'success');
  btn.innerHTML = '<i class="fas fa-check"></i> Copied';
  setTimeout(() => {
    btn.innerHTML = '<i class="fas fa-copy"></i> Copy';
  }, 2000);
}

export function aiSpeakMessage(btn) {
  const bubble = btn.closest('.ai-bubble');
  if (!bubble) return;
  const textEl = bubble.querySelector('.ai-text');
  if (!textEl) return;
  const text = textEl.innerText;
  
  if ('speechSynthesis' in window) {
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.05;
    utterance.lang = 'en-US';
    
    const voices = speechSynthesis.getVoices();
    const naturalVoice = voices.find(v => v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha'));
    if (naturalVoice) utterance.voice = naturalVoice;
    
    utterance.onstart = () => showToast('🔊 Nox is speaking...', 'info');
    utterance.onend = () => showToast('✅ Done', 'success');
    utterance.onerror = () => showToast('❌ Speech failed', 'error');
    speechSynthesis.speak(utterance);
  } else {
    showToast('Text-to-speech not supported', 'error');
  }
}

export function aiRegenerate() {
  // Find last user message and resend
  const container = $id('aiMessages');
  if (!container) return;
  const userMessages = container.querySelectorAll('.ai-message.user');
  if (userMessages.length === 0) return;
  const lastUser = userMessages[userMessages.length - 1];
  const textEl = lastUser.querySelector('.ai-text');
  if (!textEl) return;
  const text = textEl.innerText;
  aiQuickAsk(text);
}

function formatAIResponse(text) {
  if (!text) return '';
  let formatted = text.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
    return `<pre><code class="language-${lang || 'javascript'}">${escapeHtml(code.trim())}</code></pre>`;
  });
  formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');
  formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  formatted = formatted.replace(/\n/g, '<br>');
  return formatted;
}

function escapeHtml(text) {
  if (!text) return '';
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ==================== SIDEBAR TOGGLE ====================
export function aiToggleSidebar() {
  const sidebar = $id('aiSidebar');
  const overlay = $id('aiSidebarOverlay');
  if (sidebar) sidebar.classList.toggle('open');
  if (overlay) overlay.classList.toggle('show');
}

export function aiCloseSidebar() {
  const sidebar = $id('aiSidebar');
  const overlay = $id('aiSidebarOverlay');
  if (sidebar) sidebar.classList.remove('open');
  if (overlay) overlay.classList.remove('show');
}

// ==================== EXPOSE ====================
window.aiToggleThinkMode = aiToggleThinkMode;
window.aiToggleWebSearch = aiToggleWebSearch;
window.aiHandleFileUpload = aiHandleFileUpload;
window.aiRemoveMedia = aiRemoveMedia;
window.aiSendMessage = aiSendMessage;
window.aiQuickAsk = aiQuickAsk;
window.aiCopyMessage = aiCopyMessage;
window.aiSpeakMessage = aiSpeakMessage;
window.aiRegenerate = aiRegenerate;
window.aiNewChat = aiNewChat;
window.aiLoadConversation = aiLoadConversation;
window.aiDeleteConversation = aiDeleteConversation;
window.aiToggleSidebar = aiToggleSidebar;
window.aiCloseSidebar = aiCloseSidebar;

// Initialize on load
export async function initAI() {
  await loadAIConversations();
  
  // Auto-resize textarea
  const input = $id('aiInput');
  if (input) {
    input.addEventListener('input', function() {
      this.style.height = 'auto';
      this.style.height = Math.min(this.scrollHeight, 100) + 'px';
    });
    input.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        aiSendMessage();
      }
    });
  }
}