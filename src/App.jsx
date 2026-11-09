import React, { useEffect, useRef, useState } from "react";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

const starterPrompts = [
  "Explain something difficult in simple words",
  "Help me write a professional email",
  "Create a study plan for this week",
  "Write a Python program for beginners"
];

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [webSearch, setWebSearch] = useState(false);
  const [image, setImage] = useState(null);
  const [pdf, setPdf] = useState(null);
  const [imagePrompt, setImagePrompt] = useState("");
  const [generatedImage, setGeneratedImage] = useState("");
  const [showImageTool, setShowImageTool] = useState(false);
  const [error, setError] = useState("");
  const [listening, setListening] = useState(false);
  const [health, setHealth] = useState("Checking…");
  const bottomRef = useRef(null);
  const imageInputRef = useRef(null);
  const pdfInputRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/health`).then(r => r.json()).then(d => setHealth(d.ok ? "Nova server connected" : "Server unavailable"))
      .catch(() => setHealth("Connection unavailable"));
  }, []);

  useEffect(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), [messages, busy]);

  function newChat() {
    if (busy) return;
    recognitionRef.current?.stop();
    window.speechSynthesis?.cancel();
    setMessages([]);
    setInput("");
    setImage(null);
    setPdf(null);
    setError("");
    setGeneratedImage("");
    setShowImageTool(false);
  }

  async function sendMessage(text = input) {
    const prompt = text.trim();
    if ((!prompt && !image && !pdf) || busy) return;
    recognitionRef.current?.stop();
    setError("");
    const userMessage = { role: "user", content: prompt || "Please analyze the attached file." };
    const next = [...messages, userMessage];
    setMessages(next);
    setInput("");
    setBusy(true);

    try {
      const payload = {
        messages: next,
        webSearch,
        imageData: image,
        pdfData: pdf
      };
      const response = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Request failed");
      setMessages(current => [...current, { role: "assistant", content: data.reply }]);
      setImage(null);
      setPdf(null);
    } catch (e) {
      setMessages(messages);
      setInput(prompt);
      setError(e.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function readAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function chooseImage(file) {
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp", "image/gif"].includes(file.type)) return setError("Choose a PNG, JPG, WebP or GIF image.");
    if (file.size > 3 * 1024 * 1024) return setError("Image must be smaller than 3 MB.");
    setImage(await readAsDataUrl(file));
    setPdf(null);
    setError("");
  }

  async function choosePdf(file) {
    if (!file) return;
    if (file.type !== "application/pdf") return setError("Please choose a PDF file.");
    if (file.size > 3 * 1024 * 1024) return setError("PDF must be smaller than 3 MB.");
    setPdf({ name: file.name, data: await readAsDataUrl(file) });
    setImage(null);
    setError("");
  }

  function startVoice() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Voice input is not supported in this browser. Try Chrome on Android or desktop.");
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "te-IN";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.onresult = event => {
      const transcript = Array.from(event.results).map(r => r[0].transcript).join("");
      setInput(transcript);
    };
    recognition.onerror = () => { setListening(false); setError("Microphone input failed. Check browser permission."); };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    try { recognition.start(); setListening(true); } catch { setError("Could not start the microphone. Please try again."); }
  }

  function speak(text) {
    if (!("speechSynthesis" in window)) return setError("Text-to-speech is not supported in this browser.");
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = /[\u0C00-\u0C7F]/.test(text) ? "te-IN" : "en-US";
    window.speechSynthesis.speak(utterance);
  }

  async function makeImage() {
    if (!imagePrompt.trim() || busy) return;
    setBusy(true);
    setError("");
    setGeneratedImage("");
    try {
      const r = await fetch(`${API_BASE}/api/generate-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: imagePrompt })
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Image generation failed");
      setGeneratedImage(data.image);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-orb">✦</div><div><b>NOVA AI</b><small>Your AI companion</small></div></div>
        <button className="new-chat" disabled={busy} onClick={newChat}>＋ <span>New chat</span></button>
        <div className="side-label">TOOLS</div>
        <button className="side-link" onClick={() => setShowImageTool(v => !v)}>▧ <span>Image generation</span></button>
        <button className={`side-link ${webSearch ? "selected" : ""}`} onClick={() => setWebSearch(v => !v)}>⌕ <span>Internet search {webSearch ? "ON" : "OFF"}</span></button>
        <div className="side-bottom"><span className="status-dot" />{health}<small>Nova AI · API-powered</small><small className="creator-credit">App &amp; Website Builder:<br/><strong>Palepu Chandu</strong></small></div>
      </aside>

      <main className="main">
        <header className="topbar"><div className="mobile-brand">✦ NOVA AI</div><span className="model-pill">● AI Assistant</span><button className="top-new" disabled={busy} onClick={newChat}>＋ New chat</button></header>
        <nav className="mobile-tools" aria-label="AI tools"><button onClick={() => setShowImageTool(v => !v)}>Create image</button><button aria-pressed={webSearch} onClick={() => setWebSearch(v => !v)}>Web search {webSearch ? "ON" : "OFF"}</button></nav>
        <section className="chat-area">
          {messages.length === 0 ? (
            <div className="welcome">
              <div className="hero-orb">✦</div>
              <p className="eyebrow">YOUR PERSONAL AI ASSISTANT</p>
              <h1>What can I help<br/><span>you with today?</span></h1>
              <p className="welcome-sub">Ask anything. Explore ideas. Build something amazing.</p>
              <p className="creator-credit-main">App &amp; Website Builder: <strong>Palepu Chandu</strong></p>
              <div className="suggestions">{starterPrompts.map(p => <button key={p} onClick={() => sendMessage(p)}>{p} <span>↗</span></button>)}</div>
            </div>
          ) : (
            <div className="messages" aria-live="polite">
              {messages.map((m, i) => <div className={`message ${m.role}`} key={i}>
                <div className="avatar">{m.role === "assistant" ? "✦" : "Y"}</div>
                <div className="message-body"><div className="message-name">{m.role === "assistant" ? "Nova AI" : "You"}</div><div className="message-text">{m.content}</div>
                  {m.role === "assistant" && <button className="speak-btn" onClick={() => speak(m.content)}>🔊 Read aloud</button>}
                </div>
              </div>)}
              {busy && <div className="typing"><span></span><span></span><span></span> Nova is thinking…</div>}
              <div ref={bottomRef}/>
            </div>
          )}

          {showImageTool && <div className="image-tool"><div><b>✧ Create an image</b><button onClick={() => setShowImageTool(false)}>×</button></div><textarea aria-label="Describe your image" maxLength={4000} value={imagePrompt} onChange={e => setImagePrompt(e.target.value)} placeholder="Describe the image you want Nova to create…"/><button className="generate-btn" disabled={busy || !imagePrompt.trim()} onClick={makeImage}>{busy ? "Creating…" : "Generate image"}</button>{generatedImage && <img className="generated-image" src={generatedImage} alt="AI generated"/>}</div>}
        </section>

        <footer className="composer-wrap">
          {error && <div className="error" role="alert">{error}</div>}
          {(image || pdf) && <div className="attachment">{image ? "✓ Image attached" : `✓ ${pdf.name} attached`} <button onClick={() => {setImage(null);setPdf(null);}}>Remove ×</button></div>}
          <div className="composer">
            <button disabled={busy} className="attach-btn" title="Attach image" onClick={() => imageInputRef.current?.click()}>＋</button>
            <button disabled={busy} className="attach-btn" title="Attach PDF" onClick={() => pdfInputRef.current?.click()}>▤</button>
            <input ref={imageInputRef} hidden type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={e => chooseImage(e.target.files?.[0])}/>
            <input ref={pdfInputRef} hidden type="file" accept="application/pdf" onChange={e => choosePdf(e.target.files?.[0])}/>
            <textarea aria-label="Message Nova AI" disabled={busy} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => {if (e.key === "Enter" && !e.shiftKey) {e.preventDefault();sendMessage();}}} placeholder="Message Nova AI…" rows="1"/>
            <button className={`mic-btn ${listening ? "listening" : ""}`} title="Voice input" onClick={startVoice}>🎙</button>
            <button aria-label="Send message" className="send-btn" disabled={busy || (!input.trim() && !image && !pdf)} onClick={() => sendMessage()}>↑</button>
          </div>
          <p className="disclaimer">Nova AI can make mistakes. Verify important information. API usage may incur charges.</p><p className="creator-footer">App &amp; Website Builder: <strong>Palepu Chandu</strong></p>
        </footer>
      </main>
    </div>
  );
}
