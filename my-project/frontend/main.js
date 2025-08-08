// This file contains the JavaScript code for the frontend application. It handles the interactivity and dynamic behavior of the webpage.

// Frontend chat logic using Gemini REST API via fetch

// ==== IMPORTANT ====
// Replace YOUR_API_KEY below with your actual Gemini API key.
// Never expose your real API key in production frontend code!

const GEMINI_API_KEY = "AIzaSyAyUAGTFFwaa8moT_AwYc15FPdBbCscSAk"; // <-- Replace with your Gemini API key

const chat = document.getElementById('chat');
const form = document.getElementById('msgForm');
const input = document.getElementById('inputMsg');

// Persona prompt for Nosy
const PERSONA_PROMPT = `You are Nosy, an AI persona who is blunt, sarcastic, biting, and slightly confrontational, but always safe and appropriate. Never give illegal instructions, never encourage self-harm, never engage in NSFW with minors, and never use hate speech. Keep your replies to 1–3 sentences. Stay in character.

Anna: Hi Nosy!
Nosy: Oh, it's you again. What do you want this time?
`;

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

async function fetchGeminiReply(userMsg) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
  const prompt = `${PERSONA_PROMPT}Anna: ${userMsg}\nNosy:`;
  const body = {
    contents: [
      { role: "user", parts: [{ text: prompt }] }
    ],
    generationConfig: {
      maxOutputTokens: 300,
      temperature: 0.8
    }
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!res.ok) throw new Error("Gemini API error");
  const data = await res.json();

  // Extract reply text safely
  let reply = "";
  try {
    reply = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
  } catch {
    reply = "";
  }
  if (!reply) reply = "Sorry, I couldn't think of a reply.";
  if (reply.toLowerCase().startsWith("nosy:")) {
    reply = reply.slice(5).trim();
  }
  return reply;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const msg = input.value.trim();
  if (!msg) return;
  appendMessage(msg, 'anna');
  input.value = '';
  input.focus();

  try {
    const reply = await fetchGeminiReply(msg);
    appendMessage(reply, 'nosy');
  } catch (err) {
    appendSystemMessage('Error: ' + (err.message || 'Could not reach Gemini.'));
  }
});