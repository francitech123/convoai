// ============================================
// FAQ MODULE
// ============================================

import { $id, escapeHtml } from './utils.js';

const FAQ_DATA = [
  { category: "exam", question: "How does Exam Mode work?", answer: "Exam Mode simulates a real CBT exam:\n• ⏱️ Timed: You have a set time limit\n• ❌ No hints available\n• 🚫 Anti-cheat: Tab switching triggers warnings\n• 📊 Instant results after submission\n• 🏆 Scores affect your leaderboard rank\n\nPerfect for final exam preparation!" },
  { category: "exam", question: "What happens if I switch tabs during an exam?", answer: "⚠️ First tab switch: Warning message\n⚠️ Second tab switch: Exam auto-submits\n\nThis prevents cheating and ensures fair assessment. Always stay on the exam tab until completion!" },
  { category: "exam", question: "Can I pause an exam?", answer: "No, exams cannot be paused once started. The timer continues running even if you close the browser. Make sure you have uninterrupted time before starting an exam." },
  { category: "exam", question: "What happens if I lose internet during an exam?", answer: "If your internet disconnects:\n1. The timer continues counting\n2. Your answers are saved locally\n3. Try to reconnect quickly\n4. If reconnection fails, the exam will auto-submit with your current answers\n\nWe recommend a stable internet connection before starting." },
  
  { category: "test", question: "How is Test Mode different from Exam Mode?", answer: "Test Mode is for learning:\n• 💡 Hints available for each question\n• ⏱️ Still timed, but more relaxed\n• ✅ No leaderboard impact\n• 📚 Great for practice and learning\n• 🧪 Includes explanations for answers\n\nUse Test Mode to master topics before attempting Exam Mode!" },
  { category: "test", question: "Can I use hints during a test?", answer: "Yes! Test Mode includes a 'Show Hint' button for each question. Hints provide guidance without giving away the full answer - perfect for learning!" },
  
  { category: "account", question: "How do I change my profile information?", answer: "Go to Profile page → Edit Profile\n\nYou can update:\n• Full Name\n• Email address\n• Faculty & Department\n• Level (100-200)\n• Profile picture\n\nSave changes and they'll be updated immediately." },
  { category: "account", question: "How do I reset my password?", answer: "1. Go to Login page\n2. Click 'Forgot Password'\n3. Enter your registered email\n4. Check your email for reset link\n5. Follow the link to create a new password\n\nContact support if you don't receive the email." },
  { category: "account", question: "Can I delete my account?", answer: "Yes, go to Profile → Danger Zone → Delete My Account\n\n⚠️ WARNING: This action is permanent! All your data including exam history, scores, and progress will be lost forever." },
  
  { category: "technical", question: "The page isn't loading properly. What should I do?", answer: "Try these fixes:\n1. 🔄 Refresh the page\n2. 🗑️ Clear your browser cache\n3. 🌐 Check your internet connection\n4. 🔄 Try a different browser (Chrome recommended)\n5. 📱 Try on a different device\n\nIf the issue persists, contact support via Live Chat or email." },

  { category: "general", question: "What free courses are available?", answer: " ALL 72+ courses across all faculties!are free" },
  { category: "general", question: "How does the study streak work?", answer: "Your study streak tracks consecutive days you've taken an exam or test. Each day you complete at least one exam or test, your streak increases. Miss a day and it resets to 0!\n\n📅 Longest Streak tracks your best performance ever.\n🔥 Keep the streak going daily!" },
  { category: "general", question: "What are achievements and how do I earn them?", answer: "Achievements are badges you earn for milestones:\n🏆 First Exam Completed\n🔥 7-Day Streak\n⭐ Perfect Score (100%)\n📚 Course Master (10 exams in one course)\n🎓 Faculty Champion\n👑 Top 10 Leaderboard\n\nKeep practicing to unlock all achievements!" },
  { category: "general", question: "How do I contact support?", answer: "You can reach us through:\n• 💬 Live Chat (fastest response)\n• 📧 Email: francistech123@gmail.com\n• 📱 WhatsApp Channel (link in Contact page)\n• 💬 Telegram Group (link in Contact page)\n\nWe typically respond within 2-4 hours on weekdays." }
];

let faqCategory = 'all';
let faqSearch = '';

export function renderFAQs() {
  const grid = $id('faqGrid');
  if (!grid) return;
  
  let filtered = [...FAQ_DATA];
  
  if (faqCategory !== 'all') {
    filtered = filtered.filter(f => f.category === faqCategory);
  }
  
  if (faqSearch) {
    const term = faqSearch.toLowerCase();
    filtered = filtered.filter(f => 
      f.question.toLowerCase().includes(term) || 
      f.answer.toLowerCase().includes(term)
    );
  }
  
  if (filtered.length === 0) {
    grid.innerHTML = `<div class="empty-state"><i class="fas fa-search" style="font-size:2rem;display:block;margin-bottom:12px;opacity:.5"></i><p>No matching questions found.</p><p style="font-size:.8rem;color:var(--text-secondary);margin-top:4px">Try a different search term or category</p></div>`;
    return;
  }
  
  grid.innerHTML = filtered.map((faq) => `
    <div class="faq-item" data-category="${faq.category}">
      <div class="faq-question" onclick="window.toggleFaqAnswer(this)">
        <span>${escapeHtml(faq.question)}</span>
        <i class="fas fa-chevron-down"></i>
      </div>
      <div class="faq-answer">
        <p>${faq.answer.replace(/\n/g, '<br>').replace(/•/g, '•')}</p>
      </div>
    </div>
  `).join('');
}

export function toggleFaqAnswer(element) {
  const answer = element.nextElementSibling;
  const icon = element.querySelector('i');
  
  if (answer.classList.contains('show')) {
    answer.classList.remove('show');
    element.classList.remove('open');
  } else {
    document.querySelectorAll('.faq-answer').forEach(a => a.classList.remove('show'));
    document.querySelectorAll('.faq-question').forEach(q => q.classList.remove('open'));
    
    answer.classList.add('show');
    element.classList.add('open');
  }
}

export function filterFaqs(category, btn) {
  if (category) {
    faqCategory = category;
    document.querySelectorAll('.category-tab').forEach(tab => {
      if (tab.dataset.cat === category) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });
  }
  renderFAQs();
}

export function searchFaqs() {
  const input = $id('faqSearch');
  if (input) {
    faqSearch = input.value.trim();
    renderFAQs();
  }
}

// Initialize FAQ search listener
document.addEventListener('DOMContentLoaded', () => {
  const search = $id('faqSearch');
  if (search) {
    search.addEventListener('input', searchFaqs);
  }
});

// Expose functions to window
window.toggleFaqAnswer = toggleFaqAnswer;
window.filterFaqs = filterFaqs;
window.searchFaqs = searchFaqs;
window.renderFAQs = renderFAQs;