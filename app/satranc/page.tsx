"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Chess, type Square } from "chess.js";

const glyphs: Record<string, string> = {
  wk: "♔", wq: "♕", wr: "♖", wb: "♗", wn: "♘", wp: "♙",
  bk: "♚", bq: "♛", br: "♜", bb: "♝", bn: "♞", bp: "♟",
};
const files = "abcdefgh";


const values: Record<string, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };
function evaluate(position: Chess) {
  if (position.isCheckmate()) return position.turn() === "w" ? -100000 : 100000;
  if (position.isDraw()) return 0;
  let score = 0;
  for (const row of position.board()) for (const piece of row) if (piece) score += (piece.color === "w" ? 1 : -1) * values[piece.type];
  return score;
}
function minimax(position: Chess, depth: number, alpha: number, beta: number): number {
  if (depth === 0 || position.isGameOver()) return evaluate(position);
  const max = position.turn() === "w";
  let best = max ? -Infinity : Infinity;
  for (const move of position.moves({ verbose: true })) {
    const next = new Chess(position.fen());
    next.move({ from: move.from, to: move.to, promotion: "q" });
    const score = minimax(next, depth - 1, alpha, beta);
    best = max ? Math.max(best, score) : Math.min(best, score);
    if (max) alpha = Math.max(alpha, best); else beta = Math.min(beta, best);
    if (beta <= alpha) break;
  }
  return best;
}
function computerMove(position: Chess, level: string) {
  const moves = position.moves({ verbose: true });
  if (!moves.length) return null;
  if (level === "easy") return moves[Math.floor(Math.random() * moves.length)];
  let best = Infinity;
  let choices: typeof moves = [];
  const depth = level === "hard" ? 2 : 1;
  for (const move of moves) {
    const next = new Chess(position.fen());
    next.move({ from: move.from, to: move.to, promotion: "q" });
    const score = minimax(next, depth, -Infinity, Infinity);
    if (score < best) { best = score; choices = [move]; }
    else if (score === best) choices.push(move);
  }
  return choices[Math.floor(Math.random() * choices.length)] || moves[0];
}
\nexport default function ChessGame() {
  const game = useRef(new Chess());
  const [fen, setFen] = useState(game.current.fen());
  const [selected, setSelected] = useState<Square | null>(null);
  const [lastMove, setLastMove] = useState<[string, string] | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [flipped, setFlipped] = useState(false);
  const [mode, setMode] = useState<"computer" | "two">("computer");
  const [difficulty, setDifficulty] = useState("medium");
  const [thinking, setThinking] = useState(false);

  const board = useMemo(() => {
    const rows = game.current.board();
    return flipped ? [...rows].reverse().map(row => [...row].reverse()) : rows;
  }, [fen, flipped]);

  const legalTargets = useMemo(() => {
    if (!selected) return [];
    return game.current.moves({ square: selected, verbose: true }).map(move => move.to);
  }, [selected, fen]);

  const turn = game.current.turn();
  const over = game.current.isGameOver();
  const checked = game.current.isCheck();

  useEffect(() => {
    if (mode !== "computer" || turn !== "b" || over) { setThinking(false); return; }
    setThinking(true);
    const timer = window.setTimeout(() => {
      if (game.current.turn() !== "b" || game.current.isGameOver()) { setThinking(false); return; }
      const move = computerMove(game.current, difficulty);
      if (move) {
        const played = game.current.move({ from: move.from, to: move.to, promotion: "q" });
        setLastMove([played.from, played.to]);
        setSelected(null);
        setFen(game.current.fen());
        setHistory(game.current.history());
      }
      setThinking(false);
    }, 450);
    return () => window.clearTimeout(timer);
  }, [fen, mode, difficulty, turn, over]);
\n  const status = game.current.isCheckmate()
    ? `Şah mat! ${turn === "w" ? "Siyah" : "Beyaz"} kazandı.`
    : game.current.isStalemate() ? "Pat! Oyun berabere."
    : game.current.isThreefoldRepetition() ? "Üç tekrar: beraberlik."
    : game.current.isInsufficientMaterial() ? "Yetersiz taş: beraberlik."
    : game.current.isDraw() ? "Berabere!"
    : checked ? `Şah! ${turn === "w" ? "Beyaz" : "Siyah"} hamle yapmalı.`
    : `${turn === "w" ? "Beyaz" : "Siyah"} oynuyor`;

  function sync() {
    setFen(game.current.fen());
    setHistory(game.current.history());
  }

  function clickSquare(square: Square) {
    if (over || (mode === "computer" && turn === "b")) return;
    const piece = game.current.get(square);
    if (selected) {
      const possible = game.current.moves({ square: selected, verbose: true }).some(m => m.to === square);
      if (possible) {
        try {
          const move = game.current.move({ from: selected, to: square, promotion: "q" });
          setLastMove([move.from, move.to]);
          setSelected(null);
          sync();
          return;
        } catch { /* invalid move: keep the board unchanged */ }
      }
    }
    if (piece && piece.color === turn) setSelected(square);
    else setSelected(null);
  }

  function reset() {
    game.current = new Chess();
    setSelected(null);
    setLastMove(null);
    setHistory([]);
    setFen(game.current.fen());
  }

  return (
    <main className="chessPage">
      <nav className="chessNav">
        <a className="chessLogo" href="/"><span>A</span> ayzek</a>
        <a className="backStore" href="/indir">← Ay Zek Mağaza</a>
      </nav>
      <section className="chessIntro">
        <div className="eyebrow">AY ZEK OYUNLAR</div>
        <h1>Satranç <span>♞</span></h1>
        <p>Stratejini kur, hamleni yap ve şah mat et.</p>
      </section>
      <section className="gameLayout">
        <div className="boardPanel">
          <div className="playerLine"><span className={turn === "b" && !over ? "turnDot active" : "turnDot"} /> Siyah {mode === "computer" ? "· Bilgisayar" : "· Oyuncu 2"} <small>{turn === "b" && !over ? (thinking ? "Düşünüyor…" : "Sırası") : "Bekliyor"}</small></div>
          <div className="boardFrame">
            <div className="chessBoard" role="grid" aria-label="Satranç tahtası">
              {board.map((row, r) => row.map((piece, c) => {
                const file = flipped ? 7 - c : c;
                const rank = flipped ? r + 1 : 8 - r;
                const square = `${files[file]}${rank}` as Square;
                const light = (file + rank) % 2 === 0;
                const isSelected = selected === square;
                const isTarget = legalTargets.includes(square);
                const isLast = !!lastMove?.includes(square);
                const isKingCheck = checked && piece?.type === "k" && piece.color === turn;
                return (
                  <button
                    key={square}
                    role="gridcell"
                    aria-label={`${square} ${piece ? (piece.color === "w" ? "beyaz" : "siyah") + " " + piece.type : "boş"}`}
                    className={`square ${light ? "light" : "dark"} ${isSelected ? "selected" : ""} ${isLast ? "lastMove" : ""} ${isKingCheck ? "inCheck" : ""}`}
                    onClick={() => clickSquare(square)}
                  >
                    {c === 0 && <span className="rankLabel">{rank}</span>}
                    {r === 7 && <span className="fileLabel">{files[file]}</span>}
                    {piece && <span className={`piece ${piece.color === "w" ? "whitePiece" : "blackPiece"}`}>{glyphs[piece.color + piece.type]}</span>}
                    {isTarget && <span className={piece ? "captureHint" : "moveHint"} />}
                  </button>
                );
              }))}
            </div>
          </div>
          <div className="playerLine bottomPlayer"><span className={turn === "w" && !over ? "turnDot active" : "turnDot"} /> Beyaz · Sen <small>{turn === "w" && !over ? "Sıra sende" : "Bekliyor"}</small></div>
        </div>
        <aside className="gameSide">
          <div className="statusCard">
            <div className="sideEyebrow">OYUN DURUMU</div>
            <div className="statusText"><span className={checked ? "statusIcon alert" : "statusIcon"}>{over ? "♛" : checked ? "!" : "♟"}</span><b>{status}</b></div>
            <p>{over ? "Yeni bir oyun başlatarak tekrar oynayabilirsin." : "Tahtadaki taşlardan birine dokun, ardından hedef kareyi seç."}</p>
          </div>
          <div className="modeCard">
            <b>Oyun modu</b>
            <div className="modeButtons">
              <button className={mode === "computer" ? "modeChoice chosen" : "modeChoice"} onClick={() => { setMode("computer"); reset(); }}>🤖 Bilgisayara karşı</button>
              <button className={mode === "two" ? "modeChoice chosen" : "modeChoice"} onClick={() => { setMode("two"); reset(); }}>♟️ İki kişi</button>
            </div>
            {mode === "computer" && <label className="difficultyLabel">Zorluk
              <select value={difficulty} onChange={e => setDifficulty(e.target.value)}>
                <option value="easy">Kolay</option><option value="medium">Orta</option><option value="hard">Zor</option>
              </select>
            </label>}
          </div>
          <div className="actionRow">
            <button onClick={reset} className="primaryAction">↻ Yeni oyun</button>
            <button onClick={() => { setFlipped(v => !v); setSelected(null); }} className="secondaryAction">⇅ Tahtayı çevir</button>
          </div>
          <div className="movesCard">
            <div className="movesHead"><b>Hamle geçmişi</b><span>{history.length} hamle</span></div>
            {history.length === 0 ? <div className="noMoves">♙<p>İlk hamleni bekliyoruz.</p></div> : (
              <div className="moveList">
                {Array.from({ length: Math.ceil(history.length / 2) }, (_, i) => (
                  <div className="movePair" key={i}><span>{i + 1}.</span><b>{history[i * 2]}</b><b>{history[i * 2 + 1] || "…"}</b></div>
                ))}
              </div>
            )}
          </div>
          <div className="rulesNote"><b>♜ Nasıl oynanır?</b><p>{mode === "computer" ? "Beyaz taşlarla bilgisayara karşı oyna. Bilgisayar siyah taşlarla hamle yapar." : "Taşını seç ve gitmek istediğin kareye dokun. Yalnızca kurallara uygun hamleler yapılabilir."} Piyon son sıraya ulaşınca vezire dönüşür.</p></div>
        </aside>
      </section>
      <footer className="chessFooter">© {new Date().getFullYear()} Ay Zek · İyi oyunlar!</footer>
      <style jsx global>{`
        *{box-sizing:border-box}.chessPage{min-height:100vh;background:radial-gradient(ellipse at 50% 0%,#7048ad30,transparent 44%),#0a0b12;color:#f6f3fc;font-family:Arial,sans-serif;padding-bottom:35px}.chessNav{height:68px;border-bottom:1px solid #ffffff15;display:flex;align-items:center;justify-content:space-between;padding:0 max(5%,calc((100% - 1120px)/2))}.chessLogo{display:flex;align-items:center;gap:9px;color:#fff;text-decoration:none;font-size:20px;font-weight:800}.chessLogo span{width:32px;height:32px;display:grid;place-items:center;border-radius:10px;background:linear-gradient(135deg,#a78bfa,#e879f9);color:#1a1026}.backStore{font-size:12px;color:#c4b5fd;text-decoration:none}.chessIntro{width:min(1050px,92%);margin:40px auto 24px}.eyebrow,.sideEyebrow{font-size:9px;font-weight:800;letter-spacing:1.8px;color:#b9a0ff}.chessIntro h1{font-size:38px;letter-spacing:-1.5px;margin:10px 0 7px}.chessIntro h1 span{color:#c4b5fd}.chessIntro p{font-size:13px;color:#9691a4;margin:0}.gameLayout{width:min(1050px,92%);margin:auto;display:grid;grid-template-columns:minmax(0,1.35fr) minmax(270px,.75fr);gap:24px;align-items:start}.boardPanel{padding:18px;background:#141621;border:1px solid #ffffff16;border-radius:18px;box-shadow:0 20px 60px #0004}.playerLine{height:30px;display:flex;align-items:center;gap:8px;font-size:12px;color:#e6e0f1}.playerLine small{margin-left:auto;color:#888398;font-size:10px}.turnDot{width:8px;height:8px;border-radius:50%;background:#625c70}.turnDot.active{background:#a78bfa;box-shadow:0 0 10px #a78bfa}.boardFrame{padding:7px;background:#282237;border-radius:9px}.chessBoard{width:100%;aspect-ratio:1;display:grid;grid-template-columns:repeat(8,1fr);grid-template-rows:repeat(8,1fr);overflow:hidden;border-radius:3px}.square{border:0;position:relative;display:grid;place-items:center;padding:0;cursor:pointer;min-width:0;min-height:0}.square.light{background:#eadfc9}.square.dark{background:#8b6a8c}.square.selected{background:#c4c46b}.square.lastMove.light{background:#d8d889}.square.lastMove.dark{background:#a8a65a}.square.inCheck{background:#d65c5c}.piece{font-family:Georgia,serif;font-size:clamp(27px,5vw,58px);line-height:1;z-index:1;user-select:none}.whitePiece{color:#fffaf0;text-shadow:0 2px 2px #352b2b,1px 1px 1px #352b2b,-1px -1px 1px #352b2b}.blackPiece{color:#28222d;text-shadow:0 1px 0 #ffffff55}.rankLabel,.fileLabel{position:absolute;font-size:9px;font-weight:700;z-index:2;opacity:.75}.rankLabel{top:3px;left:4px}.fileLabel{bottom:3px;right:4px}.light .rankLabel,.light .fileLabel{color:#705b59}.dark .rankLabel,.dark .fileLabel{color:#f7e8f0}.moveHint{position:absolute;width:24%;height:24%;border-radius:50%;background:#2b263b66}.captureHint{position:absolute;inset:3px;border:4px solid #29233d88;border-radius:50%}.bottomPlayer{margin-top:4px}.gameSide{display:flex;flex-direction:column;gap:13px}.statusCard,.movesCard,.rulesNote{background:#141621;border:1px solid #ffffff16;border-radius:15px;padding:17px}.statusText{display:flex;align-items:center;gap:11px;margin-top:15px}.statusText b{font-size:13px;line-height:1.4}.statusIcon{width:34px;height:34px;display:grid;place-items:center;border-radius:10px;background:#a78bfa20;color:#d2bfff;font-size:20px}.statusIcon.alert{background:#ef444422;color:#fca5a5}.statusCard p,.rulesNote p{font-size:10px;color:#918ba0;line-height:1.7;margin:12px 0 0}.modeCard{background:#141621;border:1px solid #ffffff16;border-radius:15px;padding:15px}.modeCard>b{font-size:12px}.modeButtons{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:11px}.modeChoice{padding:10px 5px;border-radius:8px;border:1px solid #ffffff20;background:#ffffff08;color:#c8c0d7;font-size:10px;cursor:pointer}.modeChoice.chosen{border-color:#a78bfa;background:#a78bfa20;color:#e5d9ff}.difficultyLabel{display:flex;align-items:center;justify-content:space-between;margin-top:12px;font-size:10px;color:#a9a1b8}.difficultyLabel select{background:#242033;color:#eee;border:1px solid #ffffff22;border-radius:7px;padding:7px 10px}.actionRow{display:grid;grid-template-columns:1fr 1fr;gap:8px}.actionRow button{border-radius:9px;padding:12px 7px;font-size:10px;font-weight:700;cursor:pointer}.primaryAction{border:0;background:linear-gradient(110deg,#a78bfa,#e879f9);color:#1b1028}.secondaryAction{border:1px solid #ffffff22;background:#ffffff08;color:#d8cafa}.movesHead{display:flex;justify-content:space-between;align-items:center}.movesHead b{font-size:12px}.movesHead span{font-size:10px;color:#8e879d}.noMoves{height:105px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#b9a0ff;font-size:22px}.noMoves p{font-size:10px;color:#8e879d;margin:5px}.moveList{max-height:230px;overflow:auto;margin-top:12px}.movePair{display:grid;grid-template-columns:30px 1fr 1fr;padding:8px 5px;border-bottom:1px solid #ffffff0d;font-size:11px}.movePair span{color:#777184}.movePair b{font-weight:500;color:#e5def2}.rulesNote b{font-size:11px;color:#d7c7ff}.chessFooter{text-align:center;color:#625d70;font-size:10px;margin-top:35px}@media(max-width:760px){.gameLayout{grid-template-columns:1fr;max-width:560px;gap:13px}.chessIntro{margin-top:28px}.boardPanel{padding:12px}.piece{font-size:clamp(25px,9vw,54px)}.gameSide{display:grid;grid-template-columns:1fr 1fr}.statusCard,.movesCard,.rulesNote{padding:14px}.movesCard{grid-row:span 2}.actionRow{grid-template-columns:1fr}.rulesNote p{font-size:9px}}@media(max-width:430px){.gameSide{display:flex}.actionRow{grid-template-columns:1fr 1fr}.chessIntro h1{font-size:32px}.chessNav{padding:0 4%}.backStore{font-size:10px}}
      `}</style>
    </main>
  );
}
