import React, { useEffect, useMemo, useRef, useState } from "react";

const CALM_COLORS = ["#8cf5ff", "#b8ffe8", "#ffd7f2", "#fff6b3"];
const EXCITING_COLORS = ["#ffd36a", "#ff8fab", "#7af5ff", "#b28cff"];

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function createObject(width, height, mode) {
  if (mode === "calm") {
    return {
      x: randomBetween(18, Math.max(20, width - 18)),
      y: randomBetween(18, Math.max(20, height - 18)),
      radius: randomBetween(10, 18),
      speed: randomBetween(0.4, 1.2),
      drift: randomBetween(-0.8, 0.8),
      color: CALM_COLORS[Math.floor(Math.random() * CALM_COLORS.length)],
    };
  }

  return {
    x: randomBetween(18, Math.max(20, width - 18)),
    y: -20,
    radius: randomBetween(10, 16),
    speed: randomBetween(2.2, 4.8),
    drift: randomBetween(-1.2, 1.2),
    color: EXCITING_COLORS[Math.floor(Math.random() * EXCITING_COLORS.length)],
  };
}

function MiniGame({ gameType = "calm" }) {
  const canvasRef = useRef(null);
  const objectsRef = useRef([]);
  const isCalmMode = useMemo(() => String(gameType).toLowerCase() === "calm", [gameType]);

  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isGameOver, setIsGameOver] = useState(false);

  const resetGame = () => {
    setScore(0);
    setTimeLeft(30);
    setIsGameOver(false);
  };

  useEffect(() => {
    if (isGameOver) return undefined;

    const interval = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(interval);
          setIsGameOver(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isGameOver]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const context = canvas.getContext("2d");
    let frameId = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.floor(rect.width * ratio);
      canvas.height = Math.floor(rect.height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      objectsRef.current = Array.from({ length: 8 }, () =>
        createObject(rect.width, rect.height, isCalmMode ? "calm" : "exciting")
      );
    };

    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      if (!canvas || !context) return;
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      context.clearRect(0, 0, width, height);

      context.fillStyle = "rgba(9, 14, 32, 0.25)";
      context.fillRect(0, 0, width, height);

      const objects = objectsRef.current;
      objects.forEach((item) => {
        item.x += item.drift;

        if (isCalmMode) {
          item.y -= item.speed;
          if (item.y < -item.radius) {
            item.y = height + item.radius;
            item.x = randomBetween(18, width - 18);
          }
          if (item.x < item.radius || item.x > width - item.radius) {
            item.drift *= -1;
          }

          context.save();
          context.beginPath();
          context.fillStyle = item.color;
          context.globalAlpha = 0.88;
          context.shadowBlur = 18;
          context.shadowColor = item.color;
          context.arc(item.x, item.y, item.radius, 0, Math.PI * 2);
          context.fill();
          context.restore();
        } else {
          item.y += item.speed;
          if (item.y > height + item.radius) {
            item.y = -20;
            item.x = randomBetween(18, width - 18);
          }
          if (item.x < item.radius || item.x > width - item.radius) {
            item.drift *= -1;
          }

          context.save();
          context.translate(item.x, item.y);
          context.rotate((Math.PI / 180) * (item.y / 2));
          context.strokeStyle = item.color;
          context.lineWidth = 2;
          context.shadowBlur = 14;
          context.shadowColor = item.color;
          context.beginPath();
          for (let i = 0; i < 5; i += 1) {
            const angle = (Math.PI / 180) * (i * 72 - 90);
            const outer = item.radius + 2;
            const inner = item.radius * 0.45;
            const px = Math.cos(angle) * outer;
            const py = Math.sin(angle) * outer;
            const ix = Math.cos(angle + Math.PI / 5) * inner;
            const iy = Math.sin(angle + Math.PI / 5) * inner;
            if (i === 0) {
              context.moveTo(px, py);
            } else {
              context.lineTo(px, py);
            }
            context.lineTo(ix, iy);
          }
          context.closePath();
          context.fillStyle = "rgba(255, 255, 255, 0.18)";
          context.fill();
          context.stroke();
          context.restore();
        }
      });

      frameId = window.requestAnimationFrame(draw);
    };

    frameId = window.requestAnimationFrame(draw);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
    };
  }, [isCalmMode, isGameOver]);

  const handleCanvasClick = (event) => {
    if (isGameOver) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const objects = objectsRef.current;
    for (let index = objects.length - 1; index >= 0; index -= 1) {
      const item = objects[index];
      const dx = x - item.x;
      const dy = y - item.y;

      if (Math.sqrt(dx * dx + dy * dy) <= item.radius + 4) {
        objects.splice(index, 1);
        objects.push(createObject(rect.width, rect.height, isCalmMode ? "calm" : "exciting"));
        setScore((prev) => prev + 1);
        break;
      }
    }
  };

  return (
    <article className={`mini-game-card ${isCalmMode ? "calm" : "exciting"}`}>
      <div className="mini-game-topbar">
        <div>
          <p className="mini-game-eyebrow">Canvas mini game</p>
          <h3>{isCalmMode ? "Calm bubble pop" : "Exciting star catch"}</h3>
        </div>
        <span className="mini-game-pulse">{isCalmMode ? "Breathe & pop" : "Catch the rush"}</span>
      </div>

      <div className="mini-game-stats-row">
        <div className="mini-game-stat-box">
          <span>Score</span>
          <strong>{score}</strong>
        </div>
        <div className="mini-game-stat-box">
          <span>Time</span>
          <strong>{timeLeft}s</strong>
        </div>
      </div>

      <p className="mini-game-description">
        {isCalmMode
          ? "Click the floating bubbles to pop them and build your calm score."
          : "Click the falling stars to catch them before the timer hits zero."}
      </p>

      <div className="canvas-wrap">
        <canvas
          ref={canvasRef}
          className="mini-game-canvas"
          onClick={handleCanvasClick}
          aria-label={isCalmMode ? "Calm bubble popping game" : "Exciting star catching game"}
        />

        {isGameOver && (
          <div className="mini-game-overlay">
            <div className="mini-game-overlay-card">
              <p>Time is up</p>
              <h4>Final score: {score}</h4>
              <button type="button" onClick={resetGame}>Play again</button>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

export default MiniGame;
