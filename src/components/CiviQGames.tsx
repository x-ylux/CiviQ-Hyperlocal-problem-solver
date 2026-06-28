import React from "react";

export interface GameItem {
  emoji: string;
  label: string;
  bin: string;
}

interface CiviQGamesProps {
  gameTab: "sort" | "quiz" | "speed";
  setGameTab: (tab: "sort" | "quiz" | "speed") => void;
  items: GameItem[];
  // Sort state
  sortScore: number;
  sortIdx: number;
  sortLevel: number;
  sortFeedback: { text: string; isCorrect: boolean | null };
  checkSortBin: (chosen: string) => void;
  nextSortItem: () => void;
  // Quiz state
  quizScore: number;
  quizIdx: number;
  quizAnswered: boolean;
  quizSelected: number | null;
  quizQs: Array<{ q: string; opts: string[]; ans: number; exp: string }>;
  onQuizOptionClick: (oIdx: number, ansIdx: number) => void;
  nextQuizQuestion: () => void;
  // Speed Sort state
  speedState: "start" | "playing" | "end";
  speedCount: number;
  speedScoreVal: number;
  speedIdx: number;
  speedFeedback: { text: string; isCorrect: boolean | null };
  onStartSpeedGame: () => void;
  onCheckSpeedAnswer: (bin: string) => void;
  onResetSpeedGame: () => void;
}

export function CiviQGames({
  gameTab,
  setGameTab,
  items,
  sortScore,
  sortIdx,
  sortLevel,
  sortFeedback,
  checkSortBin,
  nextSortItem,
  quizScore,
  quizIdx,
  quizAnswered,
  quizSelected,
  quizQs,
  onQuizOptionClick,
  nextQuizQuestion,
  speedState,
  speedCount,
  speedScoreVal,
  speedIdx,
  speedFeedback,
  onStartSpeedGame,
  onCheckSpeedAnswer,
  onResetSpeedGame,
}: CiviQGamesProps) {
  const activeSortItem = items[sortIdx % items.length];
  const activeSpeedItem = items[speedIdx % items.length];

  return (
    <div className="page active" id="page-games" style={{ display: "block" }}>
      <div className="page-hero">
        <h2>
          <i className="fas fa-gamepad"></i> Play & Learn
        </h2>
        <p>Fun games that teach you waste management, civic rights & more. Earn XP while you play!</p>
      </div>
      <div className="section">
        <div className="section-inner">
          <div style={{ display: "flex", gap: ".75rem", marginBottom: "1.75rem", flexWrap: "wrap" }}>
            <button
              className={`btn ${gameTab === "sort" ? "btn-green" : "btn-outline"}`}
              onClick={() => {
                setGameTab("sort");
                onResetSpeedGame();
              }}
            >
              <i className="fas fa-recycle"></i> Bin Sorter
            </button>
            <button
              className={`btn ${gameTab === "quiz" ? "btn-green" : "btn-outline"}`}
              onClick={() => {
                setGameTab("quiz");
                onResetSpeedGame();
              }}
            >
              <i className="fas fa-question-circle"></i> Civic Quiz
            </button>
            <button className={`btn ${gameTab === "speed" ? "btn-green" : "btn-outline"}`} onClick={() => setGameTab("speed")}>
              <i className="fas fa-bolt"></i> Speed Sort
            </button>
          </div>

          {/* BIN SORT GAME */}
          {gameTab === "sort" && activeSortItem && (
            <div id="game-sort" className="game-container">
              <div className="game-title">♻️ Bin Sorter Challenge</div>
              <div className="game-score">
                <i className="fas fa-star"></i> Score: {sortScore} | Level: {sortLevel}
              </div>
              <div style={{ fontSize: ".85rem", color: "var(--muted)", marginBottom: "1.25rem" }}>
                Which bin does this item go in? Tap the right bin!
              </div>
              <div className="game-bin-row">
                <div className="game-bin" onClick={() => checkSortBin("red")}>
                  <span className="game-bin-icon">🗑️</span>
                  <span className="game-bin-label bin-red-label">Non-biodegradable (Red)</span>
                </div>
                <div className="game-bin" onClick={() => checkSortBin("green")}>
                  <span className="game-bin-icon">🟢</span>
                  <span className="game-bin-label bin-green-label">Biodegradable (Green)</span>
                </div>
                <div className="game-bin" onClick={() => checkSortBin("blue")}>
                  <span className="game-bin-icon">🔵</span>
                  <span className="game-bin-label bin-blue-label">Dry Recyclable (Blue)</span>
                </div>
              </div>
              <div id="gameItem" className="game-item">
                {activeSortItem.emoji}
              </div>
              <div id="gameItemLabel" className="game-item-label">
                {activeSortItem.label}
              </div>

              <div
                id="gameFeedback"
                className={`game-feedback ${
                  sortFeedback.isCorrect === true ? "correct" : sortFeedback.isCorrect === false ? "wrong" : ""
                }`}
              >
                {sortFeedback.text}
              </div>

              <button className="btn btn-green" style={{ marginTop: "1rem" }} onClick={nextSortItem}>
                <i className="fas fa-arrow-right"></i> Next item
              </button>
              <div
                style={{
                  marginTop: "1.25rem",
                  paddingTop: "1rem",
                  borderTop: "1px solid var(--border)",
                  fontSize: ".8rem",
                  color: "var(--muted)",
                }}
              >
                💡 Tip: Correct answers earn +10 XP and teach AI to recognize waste items
              </div>
            </div>
          )}

          {/* QUIZ GAME */}
          {gameTab === "quiz" && quizQs[quizIdx % quizQs.length] && (
            <div id="game-quiz" className="game-container">
              <div className="game-title">🧠 Civic Knowledge Quiz</div>
              <div className="game-score">
                <i className="fas fa-star"></i> Score: {quizScore}
              </div>

              {(() => {
                const qObj = quizQs[quizIdx % quizQs.length];
                return (
                  <div id="quizContent">
                    <div className="quiz-q" id="quizQ">
                      {qObj.q}
                    </div>
                    <div className="quiz-opts" id="quizOpts">
                      {qObj.opts.map((opt, oIdx) => {
                        let optClass = "quiz-opt";
                        if (quizAnswered) {
                          if (oIdx === qObj.ans) {
                            optClass += " correct";
                          } else if (quizSelected === oIdx) {
                            optClass += " wrong";
                          }
                        }
                        return (
                          <div key={oIdx} className={optClass} onClick={() => onQuizOptionClick(oIdx, qObj.ans)}>
                            {opt}
                          </div>
                        );
                      })}
                    </div>

                    {quizAnswered && (
                      <div
                        id="quizExplanation"
                        style={{
                          marginTop: "1rem",
                          background: "var(--bg2)",
                          borderRadius: "12px",
                          padding: "1rem",
                          fontSize: ".85rem",
                          textAlign: "left",
                          lineHeight: "1.6",
                        }}
                      >
                        💡 {qObj.exp}
                      </div>
                    )}

                    {quizAnswered && (
                      <button className="btn btn-green" style={{ marginTop: "1.25rem" }} onClick={nextQuizQuestion}>
                        Next Question <i className="fas fa-arrow-right"></i>
                      </button>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* SPEED SORT */}
          {gameTab === "speed" && (
            <div id="game-speed" className="game-container">
              <div className="game-title">⚡ Speed Sort — 60 Seconds</div>
              <div className="game-score">
                <i className="fas fa-clock"></i> Time: {speedCount}s | Score: {speedScoreVal}
              </div>

              {speedState === "start" && (
                <div id="speedStart" style={{ marginTop: "2rem" }}>
                  <p style={{ color: "var(--muted)", marginBottom: "1.25rem" }}>
                    Sort as many items as you can in 60 seconds! Top scorers get bonus Civic Credits.
                  </p>
                  <button className="btn btn-green" onClick={onStartSpeedGame}>
                    <i className="fas fa-play"></i> Start Game
                  </button>
                </div>
              )}

              {speedState === "playing" && activeSpeedItem && (
                <div id="speedContent">
                  <div style={{ fontSize: "4rem", margin: "1rem 0" }} id="speedItem">
                    {activeSpeedItem.emoji}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "1.25rem" }} id="speedLabel">
                    {activeSpeedItem.label}
                  </div>
                  <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}>
                    <button
                      className="btn"
                      style={{ background: "#FFEBEE", color: "#C62828", fontSize: "1.1rem", padding: ".85rem 1.5rem" }}
                      onClick={() => onCheckSpeedAnswer("red")}
                    >
                      🗑️ Non-bio
                    </button>
                    <button
                      className="btn"
                      style={{ background: "#E8F5E9", color: "#2E7D32", fontSize: "1.1rem", padding: ".85rem 1.5rem" }}
                      onClick={() => onCheckSpeedAnswer("green")}
                    >
                      🟢 Biodeg
                    </button>
                    <button
                      className="btn"
                      style={{ background: "#E3F2FD", color: "#1565C0", fontSize: "1.1rem", padding: ".85rem 1.5rem" }}
                      onClick={() => onCheckSpeedAnswer("blue")}
                    >
                      🔵 Recycle
                    </button>
                  </div>
                  <div
                    id="speedFeedback"
                    style={{
                      marginTop: ".85rem",
                      fontSize: ".9rem",
                      fontWeight: 600,
                      minHeight: "28px",
                      color: speedFeedback.isCorrect ? "var(--leaf)" : "var(--red-bin)",
                    }}
                  >
                    {speedFeedback.text}
                  </div>
                </div>
              )}

              {speedState === "end" && (
                <div id="speedEnd" style={{ textAlign: "center", padding: "1.5rem" }}>
                  <div style={{ fontSize: "3rem", marginBottom: ".75rem" }}>🏆</div>
                  <div style={{ fontSize: "1.5rem", fontWeight: 700, fontFamily: "Poppins, sans-serif" }}>
                    Final Score: {speedScoreVal}
                  </div>
                  <div style={{ color: "var(--muted)", margin: ".5rem 0 1.25rem" }}>
                    XP earned:{" "}
                    <span id="speedXP" style={{ color: "var(--amber)", fontWeight: 700 }}>
                      {speedScoreVal * 2} XP
                    </span>
                  </div>
                  <button className="btn btn-green" onClick={onResetSpeedGame}>
                    Play Again
                  </button>
                </div>
              )}
            </div>
          )}

          {/* XP from games card */}
          <div style={{ marginTop: "1.5rem" }} className="card card-body">
            <div style={{ fontWeight: 700, fontFamily: "Poppins, sans-serif", fontSize: ".9rem", marginBottom: ".75rem" }}>
              <i className="fas fa-star" style={{ color: "var(--amber)" }}></i> XP you can earn from games
            </div>
            <div className="grid g3">
              <div style={{ textAlign: "center", padding: ".75rem", background: "var(--bg2)", borderRadius: "12px" }}>
                <div style={{ fontSize: "1.5rem", marginBottom: ".3rem" }}>♻️</div>
                <div style={{ fontSize: ".78rem", fontWeight: 600 }}>Bin Sorter</div>
                <div style={{ fontSize: ".72rem", color: "var(--muted)" }}>+10 XP per item</div>
              </div>
              <div style={{ textAlign: "center", padding: ".75rem", background: "var(--bg2)", borderRadius: "12px" }}>
                <div style={{ fontSize: "1.5rem", marginBottom: ".3rem" }}>🧠</div>
                <div style={{ fontSize: ".78rem", fontWeight: 600 }}>Civic Quiz</div>
                <div style={{ fontSize: ".72rem", color: "var(--muted)" }}>+25 XP per question</div>
              </div>
              <div style={{ textAlign: "center", padding: ".75rem", background: "var(--bg2)", borderRadius: "12px" }}>
                <div style={{ fontSize: "1.5rem", marginBottom: ".3rem" }}>⚡</div>
                <div style={{ fontSize: ".78rem", fontWeight: 600 }}>Speed Sort</div>
                <div style={{ fontSize: ".72rem", color: "var(--muted)" }}>+2 XP per item</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
