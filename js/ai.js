// ============================================
// AI MODULE - Nox AI
// ============================================

import { apiFetch, $id, setText, showToast, getToken } from './utils.js';

let aiConvId = null;
let aiThinkMode = false;
let aiWebSearch = false;
let aiIsLoading = false;
let aiMediaFile = null;
let aiMediaData = null;

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
        content.innerHTML = `<img src="${aiMediaData}" style="max-width:100%;max-height:60px;border-radius:6px"><p style="font-size:0.6rem;margin-top:4px">${file.name}</p>`;
      } else {
        content.innerHTML = `<div style="display:flex;align-items:center;gap:8px"><i class="fas fa-file"></i> 📎 ${file.name}</div>`;
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

export async function aiSendMessage() {
  if (aiIsLoading) return;
  
  const input = $id('aiInput');
  if (!input) return;
  const message = input.value.trim();
  
  if (!message && !aiMediaData) {
    showToast('Please enter a message or upload a file', 'error');
    return;
  }
  
  aiAddMessage(message || (aiMediaFile ? `📎 Analyzing: ${aiMediaFile.name}` : ''), true);
  input.value = '';
  input.style.height = 'auto';
  
  const sendBtn = $id('aiSendBtn');
  if (sendBtn) {
    sendBtn.disabled = true;
    sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
  }
  
  aiIsLoading = true;
  const typingId = aiShowTyping();
  
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
        if (!aiConvId && data.conversationId) aiConvId = data.conversationId;
        response = data.response;
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    }
    
    aiRemoveTyping(typingId);
    if (response) {
      aiAddMessage(response, false);
    } else {
      aiAddMessage('⚠️ Nox didn\'t catch that. Please try again.', false);
    }
  } catch (error) {
    aiRemoveTyping(typingId);
    console.error('Nox AI Error:', error);
    aiAddMessage('🦉 ' + (error.message || 'Nox is having trouble. Please try again.'), false);
  }
  
  aiIsLoading = false;
  if (sendBtn) {
    sendBtn.disabled = false;
    sendBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
  }
  if (input) input.focus();
}

function aiAddMessage(content, isUser) {
  const container = $id('aiMessages');
  if (!container) return;
  
  const div = document.createElement('div');
  div.className = 'chat-message ' + (isUser ? 'user' : 'bot');
  
  const displayContent = isUser ? escapeHtml(content) : formatAIResponse(content);
  div.innerHTML = `<div class="chat-bubble">${displayContent}</div>`;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function aiShowTyping() {
  const container = $id('aiMessages');
  if (!container) return null;
  const id = 'typing_' + Date.now();
  const div = document.createElement('div');
  div.className = 'chat-message bot';
  div.id = id;
  div.innerHTML = `
    <div class="chat-bubble">
      <div class="typing-indicator">
        <div class="typing-dots"><span></span><span></span><span></span></div>
        <span style="margin-left:8px">Nox is thinking...</span>
      </div>
    </div>
  `;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  return id;
}

function aiRemoveTyping(id) {
  if (!id) return;
  const el = $id(id);
  if (el) el.remove();
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

export function aiQuickAsk(question) {
  const input = $id('aiInput');
  if (input) {
    input.value = question;
    aiSendMessage();
  }
}

// Expose functions to window
window.aiToggleThinkMode = aiToggleThinkMode;
window.aiToggleWebSearch = aiToggleWebSearch;
window.aiHandleFileUpload = aiHandleFileUpload;
window.aiRemoveMedia = aiRemoveMedia;
window.aiSendMessage = aiSendMessage;
window.aiQuickAsk = aiQuickAsk;