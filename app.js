const $ = s => document.querySelector(s);

const API_URL =
  'https://sagecore-backend-sagecore1.vercel.app/api/chat';

// ===============================
// SAGECORE ELEMENTS
// ===============================

const messages =
  $('#messages') ||
  $('.messages');

const input =
  $('#prompt') ||
  $('#messageInput') ||
  $('textarea') ||
  $('input[type="text"]');

const form =
  $('#chatForm');

const send =
  $('#chatForm button[type="submit"]') ||
  $('#sendBtn') ||
  $('#send') ||
  $('.send-btn');

const mic =
  $('#mic') ||
  $('#micBtn') ||
  $('.mic-btn');

// ===============================
// MEMORY
// ===============================

let history = JSON.parse(
  localStorage.getItem('sagecore.history') || '[]'
);

let speaking = true;
let busy = false;

// ===============================
// STATUS
// ===============================

function status(value) {
  const el =
    $('#coreStatus') ||
    $('.core-status') ||
    $('.status');

  if (el) {
    el.textContent = value;
  }

  document.body.dataset.state =
    value.toLowerCase();
}

// ===============================
// CHAT MESSAGE
// ===============================

function add(role, text) {
  if (!messages) return;

  const div = document.createElement('div');

  div.className =
    'message ' + role;

  div.textContent = text;

  messages.appendChild(div);

  messages.scrollTop =
    messages.scrollHeight;
}

// Oude gesprekken terugzetten

history.forEach(message => {
  add(
    message.role,
    message.content
  );
});

// ===============================
// SAGECORE AI
// ===============================

async function ask(text) {
  text = text.trim();

  if (!text || busy) {
    return;
  }

  busy = true;

  add('user', text);

  history.push({
    role: 'user',
    content: text
  });

  localStorage.setItem(
    'sagecore.history',
    JSON.stringify(
      history.slice(-40)
    )
  );

  status('THINKING');

  try {
    const response =
      await fetch(API_URL, {
        method: 'POST',

        headers: {
          'Content-Type':
            'application/json'
        },

        body: JSON.stringify({
          message: text
        })
      });

    let data;

    try {
      data = await response.json();
    } catch {
      throw new Error(
        'Ongeldig antwoord van de SageCore-server.'
      );
    }

    if (!response.ok) {
      throw new Error(
        data.error ||
        'AI-service error'
      );
    }

    const answer =
      data.reply;

    if (!answer) {
      throw new Error(
        'Geen antwoord ontvangen van SageCore.'
      );
    }

    add(
      'assistant',
      answer
    );

    history.push({
      role: 'assistant',
      content: answer
    });

    localStorage.setItem(
      'sagecore.history',
      JSON.stringify(
        history.slice(-40)
      )
    );

    // ===========================
    // GESPROKEN ANTWOORD
    // ===========================

    if (
      speaking &&
      'speechSynthesis' in window
    ) {
      status('SPEAKING');

      speechSynthesis.cancel();

      const utterance =
        new SpeechSynthesisUtterance(
          answer
        );

      utterance.lang =
        'nl-NL';

      utterance.onend = () => {
        status('READY');
      };

      utterance.onerror = () => {
        status('READY');
      };

      speechSynthesis.speak(
        utterance
      );

    } else {
      status('READY');
    }

  } catch (error) {
    console.error(
      'SageCore error:',
      error
    );

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

// ===============================
// CHAT FORM
// ===============================

if (form) {
  form.addEventListener(
    'submit',
    event => {
      event.preventDefault();

      if (!input) {
        console.error(
          'SageCore: invoerveld niet gevonden.'
        );

        return;
      }

      const text =
        input.value;

      input.value = '';

      ask(text);
    }
  );
}

// Fallback voor interfaces zonder form

else if (send) {
  send.addEventListener(
    'click',
    event => {
      event.preventDefault();

      if (!input) return;

      const text =
        input.value;

      input.value = '';

      ask(text);
    }
  );
}

// ===============================
// ENTER TO SEND
// ===============================

if (input && !form) {
  input.addEventListener(
    'keydown',
    event => {
      if (
        event.key === 'Enter' &&
        !event.shiftKey
      ) {
        event.preventDefault();

        if (send) {
          send.click();
        } else {
          const text =
            input.value;

          input.value = '';

          ask(text);
        }
      }
    }
  );
}

// ===============================
// MICROFOON
// ===============================

const SpeechRecognition =
  window.SpeechRecognition ||
  window.webkitSpeechRecognition;

if (mic) {
  mic.addEventListener(
    'click',
    event => {
      event.preventDefault();

      if (!SpeechRecognition) {
        alert(
          'Spraakherkenning is op deze Safari-versie ' +
          'niet beschikbaar. Je kunt SageCore wel typen.'
        );

        return;
      }

      const recognition =
        new SpeechRecognition();

      recognition.lang =
        'nl-NL';

      recognition.interimResults =
        true;

      status('LISTENING');

      recognition.onresult =
        event => {
          let transcript = '';

          for (
            let i =
              event.resultIndex;
            i <
              event.results.length;
            i++
          ) {
            transcript +=
              event.results[i][0]
                .transcript;
          }

          if (input) {
            input.value =
              transcript;
          }
        };

      recognition.onend = () => {
        status('READY');

        if (
          input &&
          input.value.trim()
        ) {
          const text =
            input.value;

          input.value = '';

          ask(text);
        }
      };

      recognition.onerror =
        error => {
          console.error(
            'Speech recognition:',
            error
          );

          status('READY');
        };

      recognition.start();
    }
  );
}

// ===============================
// SERVICE WORKER
// ===============================

if (
  'serviceWorker' in navigator
) {
  window.addEventListener(
    'load',
    () => {
      navigator
        .serviceWorker
        .register('./sw.js')
        .catch(error => {
          console.error(
            'Service Worker:',
            error
          );
        });
    }
  );
}

// ===============================
// START
// ===============================

status('READY');
