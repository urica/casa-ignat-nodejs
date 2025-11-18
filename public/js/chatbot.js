/**
 * Chatbot for Casa Ignat
 * FAQ and booking assistance
 */

(function() {
  'use strict';

  const Chatbot = {
    isOpen: false,
    conversationHistory: [],

    // FAQ Database
    faqs: {
      'program': {
        question: 'Care este programul?',
        answer: 'Suntem deschişi Luni-Vineri 09:00-18:00, Sâmbătă 10:00-16:00. Duminică închis.',
      },
      'programare': {
        question: 'Cum fac o programare?',
        answer: 'Puteți face o programare online accesând secțiunea "Programări" sau sunând la telefon.',
      },
      'servicii': {
        question: 'Ce servicii oferiti?',
        answer: 'Oferim consultații nutriționale, planuri personalizate de alimentație, și programe de slăbire.',
      },
      'pret': {
        question: 'Care sunt prețurile?',
        answer: 'Prețurile variază în funcție de serviciu. Consultația inițială este 200 RON. Contactați-ne pentru detalii.',
      },
      'locatie': {
        question: 'Unde vă aflați?',
        answer: 'Ne găsiți în centrul orașului, la adresa din secțiunea Contact.',
      },
      'anulare': {
        question: 'Cum anulez o programare?',
        answer: 'Puteți anula o programare din contul dumneavoastră sau sunând cu minim 24h înainte.',
      },
    },

    init() {
      this.createChatbotUI();
      this.attachEventListeners();
      this.loadConversationHistory();
    },

    createChatbotUI() {
      const chatbotHTML = `
        <div id="chatbot-container" class="chatbot-container">
          <div id="chatbot-button" class="chatbot-button">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>

          <div id="chatbot-window" class="chatbot-window" style="display: none;">
            <div class="chatbot-header">
              <h3>Asistent Virtual</h3>
              <button id="chatbot-close" class="chatbot-close">&times;</button>
            </div>

            <div id="chatbot-messages" class="chatbot-messages">
              <div class="chatbot-message bot-message">
                <div class="message-content">
                  Bună! Sunt asistentul virtual Casa Ignat. Cum vă pot ajuta?
                </div>
              </div>
              <div class="chatbot-quick-replies">
                <button class="quick-reply" data-intent="program">Program</button>
                <button class="quick-reply" data-intent="programare">Programare</button>
                <button class="quick-reply" data-intent="servicii">Servicii</button>
                <button class="quick-reply" data-intent="pret">Prețuri</button>
              </div>
            </div>

            <div class="chatbot-input">
              <input type="text" id="chatbot-input-field" placeholder="Scrieți mesajul..." />
              <button id="chatbot-send" class="chatbot-send-button">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </div>
          </div>
        </div>
      `;

      document.body.insertAdjacentHTML('beforeend', chatbotHTML);
    },

    attachEventListeners() {
      const button = document.getElementById('chatbot-button');
      const closeBtn = document.getElementById('chatbot-close');
      const sendBtn = document.getElementById('chatbot-send');
      const inputField = document.getElementById('chatbot-input-field');

      button.addEventListener('click', () => this.toggle());
      closeBtn.addEventListener('click', () => this.close());
      sendBtn.addEventListener('click', () => this.sendMessage());
      inputField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.sendMessage();
      });

      // Quick replies
      document.addEventListener('click', (e) => {
        if (e.target.classList.contains('quick-reply')) {
          const intent = e.target.dataset.intent;
          this.handleQuickReply(intent);
        }
      });
    },

    toggle() {
      this.isOpen = !this.isOpen;
      const window = document.getElementById('chatbot-window');
      window.style.display = this.isOpen ? 'flex' : 'none';

      if (this.isOpen) {
        document.getElementById('chatbot-input-field').focus();
      }
    },

    close() {
      this.isOpen = false;
      document.getElementById('chatbot-window').style.display = 'none';
    },

    sendMessage() {
      const inputField = document.getElementById('chatbot-input-field');
      const message = inputField.value.trim();

      if (!message) return;

      // Display user message
      this.addMessage(message, 'user');

      // Clear input
      inputField.value = '';

      // Process message
      setTimeout(() => {
        const response = this.processMessage(message);
        this.addMessage(response.text, 'bot');

        if (response.actions) {
          this.addActions(response.actions);
        }
      }, 500);

      // Save to history
      this.conversationHistory.push({
        role: 'user',
        message,
        timestamp: new Date(),
      });

      this.saveConversationHistory();
    },

    handleQuickReply(intent) {
      const faq = this.faqs[intent];
      if (faq) {
        this.addMessage(faq.question, 'user');
        setTimeout(() => {
          this.addMessage(faq.answer, 'bot');
        }, 300);
      }
    },

    processMessage(message) {
      const lowerMessage = message.toLowerCase();

      // Check for greetings
      if (/^(buna|salut|hello|hi|hey)/i.test(lowerMessage)) {
        return {
          text: 'Bună! Cu ce vă pot ajuta astăzi?',
        };
      }

      // Check for booking intent
      if (/program|rezerv|appointment/i.test(lowerMessage)) {
        return {
          text: 'Doriți să faceți o programare? Vă pot ajuta cu asta!',
          actions: [
            {
              text: 'Fă o programare',
              url: '/programari',
            },
          ],
        };
      }

      // Check for services
      if (/servicii|offer|ce fac/i.test(lowerMessage)) {
        return {
          text: this.faqs.servicii.answer,
          actions: [
            {
              text: 'Vezi toate serviciile',
              url: '/servicii',
            },
          ],
        };
      }

      // Check for schedule
      if (/program|orar|deschis|orar/i.test(lowerMessage)) {
        return {
          text: this.faqs.program.answer,
        };
      }

      // Check for prices
      if (/pret|cost|tarif/i.test(lowerMessage)) {
        return {
          text: this.faqs.pret.answer,
          actions: [
            {
              text: 'Contactează-ne',
              url: '/contact',
            },
          ],
        };
      }

      // Check for location
      if (/unde|locatie|adresa/i.test(lowerMessage)) {
        return {
          text: this.faqs.locatie.answer,
          actions: [
            {
              text: 'Vezi harta',
              url: '/contact',
            },
          ],
        };
      }

      // Check for contact
      if (/contact|telefon|email|sun/i.test(lowerMessage)) {
        return {
          text: 'Puteți să ne contactați prin:',
          actions: [
            {
              text: 'Telefon',
              url: 'tel:+40123456789',
            },
            {
              text: 'Email',
              url: 'mailto:contact@casaignat.ro',
            },
          ],
        };
      }

      // Default response
      return {
        text: 'Îmi pare rău, nu am înțeles. Puteți reformula întrebarea sau să alegeți din opțiunile de mai jos?',
        actions: [
          {
            text: 'Programări',
            url: '/programari',
          },
          {
            text: 'Servicii',
            url: '/servicii',
          },
          {
            text: 'Contact',
            url: '/contact',
          },
        ],
      };
    },

    addMessage(text, sender) {
      const messagesContainer = document.getElementById('chatbot-messages');
      const messageHTML = `
        <div class="chatbot-message ${sender}-message">
          <div class="message-content">${this.escapeHtml(text)}</div>
        </div>
      `;

      // Remove quick replies if they exist
      const quickReplies = messagesContainer.querySelector('.chatbot-quick-replies');
      if (quickReplies) {
        quickReplies.remove();
      }

      messagesContainer.insertAdjacentHTML('beforeend', messageHTML);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;

      // Save bot messages to history
      if (sender === 'bot') {
        this.conversationHistory.push({
          role: 'bot',
          message: text,
          timestamp: new Date(),
        });
        this.saveConversationHistory();
      }
    },

    addActions(actions) {
      const messagesContainer = document.getElementById('chatbot-messages');
      const actionsHTML = actions.map(action => `
        <a href="${action.url}" class="chatbot-action-button" target="${action.url.startsWith('http') ? '_blank' : '_self'}">
          ${this.escapeHtml(action.text)}
        </a>
      `).join('');

      const actionContainer = `
        <div class="chatbot-actions">
          ${actionsHTML}
        </div>
      `;

      messagesContainer.insertAdjacentHTML('beforeend', actionContainer);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    },

    escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    },

    loadConversationHistory() {
      try {
        const history = localStorage.getItem('chatbot_history');
        if (history) {
          this.conversationHistory = JSON.parse(history);
        }
      } catch (error) {
        console.error('Error loading conversation history:', error);
      }
    },

    saveConversationHistory() {
      try {
        // Keep only last 50 messages
        if (this.conversationHistory.length > 50) {
          this.conversationHistory = this.conversationHistory.slice(-50);
        }
        localStorage.setItem('chatbot_history', JSON.stringify(this.conversationHistory));
      } catch (error) {
        console.error('Error saving conversation history:', error);
      }
    },
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Chatbot.init());
  } else {
    Chatbot.init();
  }

  window.CasaIgnatChatbot = Chatbot;

})();
