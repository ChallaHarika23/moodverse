import React, { useState, useEffect } from "react";
import "./App.css";
import MiniGame from "./MiniGame";

function Particles({ colors }) {
  const particles = Array.from({ length: 20 }, (_, i) => i);
  return (
    <div className="particles">
      {particles.map((i) => (
        <div
          key={i}
          className="particle"
          style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${3 + Math.random() * 4}s`,
            background: colors ? colors[i % 3] : "#ffffff",
            width: `${5 + Math.random() * 10}px`,
            height: `${5 + Math.random() * 10}px`,
          }}
        />
      ))}
    </div>
  );
}

function App() {
  const COMPANION_NAME = "Aarav";
  const [mood, setMood] = useState("");
  const [loading, setLoading] = useState(false);
  const [universe, setUniverse] = useState(null);
  const [chatMsg, setChatMsg] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);

  const GROQ_KEY = process.env.REACT_APP_GROQ_KEY;

  const analyzeMood = async () => {
    if (!mood) return;
    setLoading(true);
    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GROQ_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          max_tokens: 1000,
          messages: [
            {
              role: "user",
              content: `Analyze this mood: "${mood}". 
              Return ONLY a JSON object with no extra text:
              {
                "emotion": "one word emotion",
                "colors": ["#hexcode1", "#hexcode2", "#hexcode3"],
                "worldTheme": "describe the world in 5 words",
                "storyOpening": "2 sentence story opening with user as hero",
                "companionName": "a creative companion name",
                "gameType": "calm or exciting",
                "companionGreeting": "one warm sentence greeting from companion"
              }`
            }
          ]
        })
      });
      const data = await response.json();
      const text = data.choices[0].message.content;
      const clean = text.replace(/```json|```/g, "").trim();
      const result = JSON.parse(clean);
      const fixedCompanion = {
        ...result,
        companionName: COMPANION_NAME,
      };
      setUniverse(fixedCompanion);
      setChatHistory([{ role: "companion", text: fixedCompanion.companionGreeting }]);
    } catch (err) {
      console.error("Error:", err);
      alert("Something went wrong!");
    }
    setLoading(false);
  };

  const sendChat = async () => {
    if (!chatMsg) return;
    const newHistory = [...chatHistory, { role: "user", text: chatMsg }];
    setChatHistory(newHistory);
    setChatMsg("");
    setChatLoading(true);
    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GROQ_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          max_tokens: 200,
          messages: [
            {
              role: "system",
              content: `You are ${COMPANION_NAME}, a magical companion in a ${universe.worldTheme} world. The user feels ${universe.emotion}. Be warm, supportive and stay in character. Keep responses to 2-3 sentences.`
            },
            { role: "user", content: chatMsg }
          ]
        })
      });
      const data = await response.json();
      const reply = data.choices[0].message.content;
      setChatHistory([...newHistory, { role: "companion", text: reply }]);
    } catch (err) {
      console.error("Error:", err);
    }
    setChatLoading(false);
  };

  return (
    <div className="app" style={{
      background: universe
        ? `linear-gradient(135deg, ${universe.colors[0]}, ${universe.colors[1]}, ${universe.colors[2]})`
        : "linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)",
      minHeight: "100vh",
      transition: "background 2s ease"
    }}>
      {universe && <Particles colors={universe.colors} />}

      {!universe ? (
        <div className="landing">
          <div className="hero-card">
            <div className="brand-row">
              <div className="logo">🌌</div>
              <span className="brand-pill">MoodVerse</span>
            </div>
            <h1 className="title">Make your mood feel alive.</h1>
            <p className="subtitle">Type how you feel and watch a glowing universe, a personalized story, and a playful game appear in one elegant experience.</p>
            <div className="feature-strip">
              <span className="feature-chip">✨ AI mood storytelling</span>
              <span className="feature-chip">🌈 Color-rich worldbuilding</span>
              <span className="feature-chip">🎮 Calm or exciting games</span>
            </div>
            <div className="input-area">
              <input
                className="mood-input"
                type="text"
                placeholder="How are you feeling right now?"
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && analyzeMood()}
              />
              <button className="generate-btn" onClick={analyzeMood} disabled={loading}>
                {loading ? "✨ Building your universe..." : "✨ Create My Universe"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="universe">
          <div className="universe-header">
            <div>
              <h1 className="universe-title">🌌 {universe.worldTheme}</h1>
              <p className="universe-caption">A world shaped around your current mood and energy.</p>
            </div>
            <p className="emotion-badge">You feel: <strong>{universe.emotion}</strong></p>
          </div>

          <div className="cards-row">
            <div className="card story-box">
              <h3>📖 Your Story</h3>
              <p>{universe.storyOpening}</p>
            </div>

            <div className="card game-box">
              <MiniGame gameType={universe.gameType || "calm"} />
            </div>

            <div className="card companion-box">
              <h3>🤖 {universe.companionName}</h3>
              <div className="chat-history">
                {chatHistory.map((msg, i) => (
                  <div key={i} className={`chat-bubble ${msg.role}`}>
                    <span>{msg.text}</span>
                  </div>
                ))}
                {chatLoading && (
                  <div className="chat-bubble companion">
                    <span>typing...</span>
                  </div>
                )}
              </div>
              <div className="chat-input-row">
                <input
                  className="chat-input"
                  type="text"
                  placeholder="Talk to your companion..."
                  value={chatMsg}
                  onChange={(e) => setChatMsg(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && sendChat()}
                />
                <button className="send-btn" onClick={sendChat}>➤</button>
              </div>
            </div>
          </div>

          <button className="reset-btn" onClick={() => { setUniverse(null); setMood(""); setChatHistory([]); }}>
            🔄 Create New Universe
          </button>
        </div>
      )}
    </div>
  );
}

export default App;