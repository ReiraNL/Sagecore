const $ = s => document.querySelector(s);

const API_URL =
  'https://sagecore-backend-sagecore1.vercel.app/api/chat';

const messages = $('#messages') || $('.messages');
const input =
  $('#messageInput') ||
  $('textarea') ||
  $('input[type=text]');

const send =
  $('#sendBtn') ||
  $('#send') ||
  $('.send-btn');

const mic =
  $('#micBtn') ||
  $('#mic') ||
  $('.mic-btn');

let history = JSON.parse(
  localStorage.getItem('sagecore.history') || '[]'
);

let speaking = true;
let busy = false;

function status(value) {
  const el =
    $('#coreStatus') ||
    $('.core-status') ||
    $('.status');

  if (el) el.textContent = value;

  document.body.dataset.state = value.toLowerCase();
}

function add(role, text) {
  if (!messages) return;

  const div = document.createElement('div');

  div.className = 'message ' + role;
  div.textContent = text;

  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

history.forEach(message => {
  add(message.role, message.content);
});

async function ask(text) {
  text = text.trim();

  if (!text || busy) return;

  busy = true;

  add('user', text);

  history.push({
    role: 'user',
    content: text
  });

  localStorage.setItem(
    'sagecore.history',
    JSON.stringify(history.slice(-40))
  );

  status('THINKING');

  try {
    const response = await fetch(API_URL, {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json'
      },

      body: JSON.stringify({
        message: text
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || 'AI service error'
      );
    }

    const answer = data.reply;

    if (!answer) {
      throw new Error(
        'Geen antwoord ontvangen van SageCore.'
      );
    }

    add('assistant', answer);

    history.push({
      role: 'assistant',
      content: answer
    });

    localStorage.setItem(
      'sagecore.history',
      JSON.stringify(history.slice(-40))
    );

    if (
      speaking &&
      'speechSynthesis' in window
    ) {
      status('SPEAKING');

      speechSynthesis.cancel();

      const utterance =
        new SpeechSynthesisUtterance(answer);

      utterance.lang = 'nl-NL';

      utterance.onend = () => {
        status('READY');
      };

      utterance.onerror = () => {
        status('READY');
      };

      speechSynthesis.speak(utterance);
    } else {
      status('READY');
    }

  } catch (error) {
    console.error(error);

    add(
      'assistant',
      'Verbinding met SageCore AI mislukt: ' +
      error.message
    );

    status('OFFLINE');

  } finally {
    busy = false;
  }
}

if (send) {
  send.onclick = () => {
    if (!input) return;

    const text = input.value;
    input.value = '';

    ask(text);
  };
}

if (input) {
  input.addEventListener('keydown', event => {
    if (
      event.key === 'Enter' &&
      !event.shiftKey
    ) {
      event.preventDefault();
      send?.click();
    }
  });
}

const SpeechRecognition =
  window.SpeechRecognition ||
  window.webkitSpeechRecognition;

if (mic) {
  mic.onclick = () => {
    if (!SpeechRecognition) {
      alert(
        'Spraakherkenning is op deze Safari-versie ' +
        'niet beschikbaar. Je kunt SageCore wel typen.'
      );

      return;
    }

    const recognition =
      new SpeechRecognition();

    recognition.lang = 'nl-NL';
    recognition.interimResults = true;

    status('LISTENING');

    recognition.onresult = event => {
      let transcript = '';

      for (
        let i = event.resultIndex;
        i < event.results.length;
        i++
      ) {
        transcript +=
          event.results[i][0].transcript;
      }

      if (input) {
        input.value = transcript;
      }
    };

    recognition.onend = () => {
      status('READY');

      if (input?.value.trim()) {
        const text = input.value;
        input.value = '';

        ask(text);
      }
    };

    recognition.onerror = () => {
      status('READY');
    };

    recognition.start();
  };
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(
      './sw.js'
    );
  });
}

status('READY');
