// This file contains the JavaScript code for the frontend application. It handles the interactivity and dynamic behavior of the webpage.

document.addEventListener('DOMContentLoaded', () => {
    const greetingElement = document.getElementById('greeting');
    greetingElement.textContent = 'Welcome to My Project!';
    
    const button = document.getElementById('myButton');
    button.addEventListener('click', () => {
        alert('Button clicked!');
    });
});

const chat = document.getElementById('chat');
const form = document.getElementById('msgForm');
const input = document.getElementById('inputMsg');

function appendMessage(text, sender) {
  const div = document.createElement('div');
  div.className = 'bubble ' + sender;
  div.textContent = text;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

function appendSystemMessage(text) {
  const div = document.createElement('div');
  div.className = 'bubble system';
  div.textContent = text;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const msg = input.value.trim();
  if (!msg) return;
  appendMessage(msg, 'anna');
  input.value = '';
  input.focus();

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg })
    });
    if (!res.ok) throw new Error('Network error');
    const data = await res.json();
    if (data.reply) {
      appendMessage(data.reply, 'nosy');
    } else {
      appendSystemMessage('No reply from Nosy.');
    }
  } catch (err) {
    appendSystemMessage('Error: ' + (err.message || 'Could not reach server.'));
  }
});