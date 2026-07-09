// ============================================
// CHAT MODULE - Support Chat
// ============================================

import { apiFetch, $id, setText, escapeHtml, timeAgo, showToast, getToken, getUser } from './utils.js';

let chatMessages = [];
let chatGuestId = null;
let chatGuestName = null;
let chatIsLoggedIn = false;
let chatUser = null;
let chatRefreshInterval = null;

export function initChat() {
  const token = getToken();
  const user = getUser();
  
  if (token && user) {
    chatIsLoggedIn = true;
    chatUser = user;
    const name = user.fullName?.split(' ')[0] || 'User';
    const avatar = $id('chatUserAvatar');
    const nameEl = $id('chatUserName');
    if (avatar) avatar.innerHTML = user.fullName?.charAt(0).toUpperCase() || '👤';
    if (nameEl) nameEl.textContent = name;
    
    const nameInput = $id('chatNameInput');
    const chatInput = $id('chatInput');
    const sendBtn = $id('chatSendBtn');
    if (nameInput) nameInput.style.display = 'none';
    if (chatInput) {
      chatInput.disabled = false;
      chatInput.placeholder = 'Type your message here...';
    }
    if (sendBtn) sendBtn.disabled = false;
    
    chatLoadMessages();
    chatStartAutoRefresh();
  } else {
    // Guest mode
    const savedName = localStorage.getItem('chat_guest_name');
    const savedId = localStorage.getItem('chat_device_id');
    if (savedName && savedName.length >= 2) {
      chatGuestName = savedName;
      chatGuestId = savedId || chatGetDeviceId();
      chatSetGuestUI();
      chatLoadMessages();
      chatStartAutoRefresh();
      chatRegisterGuest();
    }
  }
}

function chatGetDeviceId() {
  let id = localStorage.getItem('chat_device_id');
  if (!id) {
    id = 'guest_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('chat_device_id', id);
  }
  return id;
}

function chatSetGuestUI() {
  const avatar = $id('chatUserAvatar');
  const nameEl = $id('chatUserName');
  if (avatar) avatar.innerHTML = chatGuestName.charAt(0).toUpperCase();
  if (nameEl) nameEl.textContent = chatGuestName.length > 15 ? chatGuestName.substring(0, 12) + '...' : chatGuestName;
  
  const nameInput = $id('chatNameInput');
  const chatInput = $id('chatInput');
  const sendBtn = $id('chatSendBtn');
  if (nameInput) nameInput.style.display = 'none';
  if (chatInput) {
    chatInput.disabled = false;
    chatInput.placeholder = 'Type your message here...';
  }
  if (sendBtn) sendBtn.disabled = false;
}

export function chatSetName() {
  const input = $id('chatGuestName');
  if (!input) return;
  const name = input.value.trim();
  if (name.length < 2) {
    showToast('Please enter a valid name (at least 2 characters)', 'error');
    return;
  }
  chatGuestName = name;
  localStorage.setItem('chat_guest_name', chatGuestName);
  chatGuestId = chatGetDeviceId();
  chatSetGuestUI();
  chatRegisterGuest();
  chatLoadMessages();
  chatStartAutoRefresh();
  showToast('Welcome, ' + chatGuestName + '!', 'success');
}

async function chatRegisterGuest() {
  if (chatIsLoggedIn) return;
  try {
    await fetch(API_BASE + '/chat/guest/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guestId: chatGuestId, guestName: chatGuestName })
    });
  } catch(e) { console.log('Guest registration error:', e); }
}

function chatGetEndpoint() {
  if (chatIsLoggedIn) {
    return API_BASE + '/chat/send';
  } else {
    return API_BASE + '/chat/guest/send';
  }
}

function chatGetMessagesEndpoint() {
  if (chatIsLoggedIn) {
    return API_BASE + '/chat/my-messages';
  } else {
    return `${API_BASE}/chat/guest/messages?guestId=${chatGuestId}`;
  }
}

export async function chatLoadMessages() {
  if (!chatIsLoggedIn && !chatGuestId && !chatGuestName) return;
  
  try {
    const url = chatGetMessagesEndpoint();
    const headers = chatIsLoggedIn ? { 'Authorization': 'Bearer ' + getToken() } : {};
    const response = await fetch(url, { headers });
    if (!response.ok) return;
    
    const data = await response.json();
    let newMessages = chatIsLoggedIn ? (data.chats || []) : (data.messages || []);
    
    if (JSON.stringify(chatMessages) !== JSON.stringify(newMessages)) {
      chatMessages = newMessages;
      chatRenderMessages();
    }
  } catch(e) { console.log('Error loading messages:', e); }
}

function chatRenderMessages() {
  const container = $id('chatMessages');
  if (!container) return;
  
  if (!chatMessages || chatMessages.length === 0) {
    const displayName = chatIsLoggedIn ? (chatUser?.fullName?.split(' ')[0] || 'User') : (chatGuestName || 'Guest');
    container.innerHTML = `
      <div style="text-align:center;padding:30px 20px;color:var(--text-secondary)">
        <i class="fas fa-comment-dots" style="font-size:2rem;display:block;margin-bottom:12px;opacity:.5"></i>
        <p style="font-size:.85rem">Welcome to OAU Exam Support!</p>
        <p style="font-size:.7rem;margin-top:4px">${chatIsLoggedIn ? 'Welcome back, ' + displayName + '!' : 'Enter your name to start chatting.'}</p>
        <p style="font-size:.65rem;margin-top:8px;color:var(--text-secondary)">👨‍💻 Our team will respond within 24 hours</p>
      </div>
    `;
    return;
  }
  
  const currentUserId = chatIsLoggedIn ? chatUser?._id : null;
  
  container.innerHTML = chatMessages.map(chat => {
    let isUserMessage = false;
    let displayName = '';
    
    if (chatIsLoggedIn && currentUserId) {
      const chatUserId = chat.user ? chat.user.toString() : null;
      if (chatUserId === currentUserId || chat.userName === chatUser?.fullName) {
        isUserMessage = true;
        displayName = chatUser?.fullName?.split(' ')[0] || 'You';
      }
    } else if (chat.guestId === chatGuestId && chat.isGuest === true) {
      isUserMessage = true;
      displayName = chatGuestName || 'You';
    }
    
    if (isUserMessage) {
      return `
        <div class="chat-message user">
          <div class="chat-bubble">
            <div style="font-size:.65rem;font-weight:600;margin-bottom:2px;opacity:.8">${escapeHtml(displayName)}</div>
            <div>${escapeHtml(chat.message)}</div>
            <div style="font-size:.55rem;opacity:.6;margin-top:4px;text-align:right">${timeAgo(new Date(chat.createdAt))}</div>
          </div>
        </div>
      `;
    }
    
    // Admin/Support message
    const hasReply = chat.reply && chat.reply.length > 0;
    const isReplied = chat.status === 'replied';
    const replyText = chat.reply || chat.message;
    
    return `
      <div class="chat-message bot">
        <div class="chat-bubble">
          <div style="font-size:.65rem;font-weight:600;margin-bottom:2px;color:var(--accent)"><i class="fas fa-headset"></i> Support Team</div>
          ${hasReply || isReplied ? '<div style="font-size:.55rem;color:var(--accent);margin-bottom:4px"><i class="fas fa-reply"></i> Reply</div>' : ''}
          <div>${escapeHtml(replyText).replace(/\n/g, '<br>')}</div>
          <div style="font-size:.55rem;opacity:.6;margin-top:4px">${timeAgo(new Date(chat.repliedAt || chat.updatedAt || chat.createdAt))}</div>
        </div>
      </div>
    `;
  }).join('');
  
  container.scrollTop = container.scrollHeight;
}

export async function chatSendMessage() {
  if (!chatIsLoggedIn && !chatGuestName) {
    showToast('Please enter your name first', 'error');
    return;
  }
  
  const input = $id('chatInput');
  if (!input) return;
  const message = input.value.trim();
  
  if (message.length < 2) {
    showToast('Message must be at least 2 characters', 'error');
    return;
  }
  
  input.value = '';
  
  // Add user message to UI immediately
  const container = $id('chatMessages');
  if (container) {
    const displayName = chatIsLoggedIn ? (chatUser?.fullName?.split(' ')[0] || 'You') : (chatGuestName || 'You');
    const div = document.createElement('div');
    div.className = 'chat-message user';
    div.innerHTML = `
      <div class="chat-bubble">
        <div style="font-size:.65rem;font-weight:600;margin-bottom:2px;opacity:.8">${escapeHtml(displayName)}</div>
        <div>${escapeHtml(message)}</div>
        <div style="font-size:.55rem;opacity:.6;margin-top:4px;text-align:right">Just now</div>
      </div>
    `;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  }
  
  const sendBtn = $id('chatSendBtn');
  if (sendBtn) {
    sendBtn.disabled = true;
    sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
  }
  
  try {
    const endpoint = chatGetEndpoint();
    const headers = { 'Content-Type': 'application/json' };
    let body;
    
    if (chatIsLoggedIn) {
      headers['Authorization'] = 'Bearer ' + getToken();
      body = JSON.stringify({ message: message });
    } else {
      body = JSON.stringify({ 
        guestId: chatGuestId,
        guestName: chatGuestName,
        message: message
      });
    }
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: headers,
      body: body
    });
    
    if (response.ok) {
      showToast('✅ Message sent! Our team will respond within 24 hours.', 'success');
      setTimeout(() => chatLoadMessages(), 500);
    } else {
      const data = await response.json();
      showToast('❌ ' + (data.error || 'Failed to send message.'), 'error');
    }
  } catch(e) {
    showToast('❌ Network error. Please try again.', 'error');
  }
  
  if (sendBtn) {
    sendBtn.disabled = false;
    sendBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
  }
}

function chatStartAutoRefresh() {
  if (chatRefreshInterval) clearInterval(chatRefreshInterval);
  chatRefreshInterval = setInterval(() => {
    if (chatIsLoggedIn || chatGuestName) {
      chatLoadMessages();
    }
  }, 5000);
}

// Initialize chat on page load
document.addEventListener('DOMContentLoaded', () => {
  const chatInput = $id('chatInput');
  if (chatInput) {
    chatInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter' && !this.disabled) {
        e.preventDefault();
        chatSendMessage();
      }
    });
  }
  
  const guestInput = $id('chatGuestName');
  if (guestInput) {
    guestInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        chatSetName();
      }
    });
  }
});

// Expose functions to window
window.chatSetName = chatSetName;
window.chatSendMessage = chatSendMessage;
window.chatLoadMessages = chatLoadMessages;
