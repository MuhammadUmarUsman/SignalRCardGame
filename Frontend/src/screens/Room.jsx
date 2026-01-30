import { useEffect, useMemo, useState, useRef } from "react";
import { useGame } from "../game/GameContext";
import Card from "../components/cards/Card";
import TableCards from "../components/table/TableCards";
import PlayerHand from "../components/players/PlayerHand";
import Notification from "../components/ui/Notification";
import CardSnatch from "../components/animations/CardSnatch";
import GameChat from "../components/chat/GameChat";
import "./Room.css";

function usePrevious(value) {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

export default function Room() {
  const {
    userId,
    gameState,
    hubState,
    startGame,
    throwCard,
    leaveGame,
    chatMessages,
    sendChatMessage
  } = useGame();

  const { activeGameId: gameId, game } = gameState;
  const [selectedCard, setSelectedCard] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [snatchAnimations, setSnatchAnimations] = useState([]);

  const prevGame = usePrevious(game);

  if (!gameId) return <div className="room-status">No active game.</div>;

  if (hubState.lastError) {
    return (
      <div className="room-status">
        <div className="error-card">
          <h3>Unable to Join</h3>
          <p>{hubState.lastError.message ?? hubState.lastError ?? "An error occurred"}</p>
          <button onClick={() => leaveGame(gameId)} className="leave-btn">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!game) return <div className="room-status">Waiting for game updates...</div>;

  // ---------- Normalize backend payload ----------
  const players = game.Players ?? game.players ?? [];
  const tableCards = game.TableCards ?? game.tableCards ?? [];
  const isStarted = game.IsStarted ?? game.isStarted ?? false;
  const isEnded = game.IsEnded ?? game.isEnded ?? false;
  const currentTurnIndex = game.CurrentTurnIndex ?? game.currentTurnIndex ?? 0;
  const hostPlayerId = game.HostPlayerId ?? game.hostPlayerId;
  const deckCount = game.DeckCount ?? game.deckCount ?? 0;

  const winnerIds = game.WinnerPlayerIds ?? game.winnerPlayerIds ?? [];
  const winningScore = game.WinningScore ?? game.winningScore ?? null;

  const currentPlayer = players[currentTurnIndex] ?? null;
  const isHost = hostPlayerId === userId;

  const myPlayer = useMemo(
    () =>
      players.find(
        p => (p.PlayerId ?? p.playerId) === userId
      ) ?? null,
    [players, userId]
  );

  const myHand = myPlayer?.Hand ?? myPlayer?.hand ?? [];

  const isMyTurn =
    isStarted &&
    (currentPlayer?.PlayerId ?? currentPlayer?.playerId) === userId;

  // Backend is authoritative → if it's your turn, you can throw
  const canThrow = isStarted && isMyTurn && myHand.length > 0;

  // ===============================
  // Winner resolution (UI)
  // ===============================
  const winnerNames = useMemo(() => {
    if (!isEnded) return [];
    if (!winnerIds.length) return [];

    return winnerIds
      .map(id =>
        players.find(p => (p.PlayerId ?? p.playerId) === id)
      )
      .filter(Boolean)
      .map(p => p.PlayerName ?? p.playerName ?? "Player");
  }, [isEnded, winnerIds, players]);

  // Clear card selection when turn changes
  useEffect(() => {
    if (!isMyTurn) {
      setSelectedCard(null);
    }
  }, [isMyTurn]);

  // Helper to add notification
  const addNotification = (msg, type = 'info') => {
    const id = Date.now() + Math.random();
    setNotifications(prev => {
      const updated = [...prev, { id, msg, type }];
      if (updated.length > 3) {
        return updated.slice(updated.length - 3);
      }
      return updated;
    });
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Detect Game State Changes
  useEffect(() => {
    if (!prevGame || !game) return;

    // 1. Turn Change Notification
    const prevTurnIdx = prevGame.CurrentTurnIndex ?? prevGame.currentTurnIndex;
    const currTurnIdx = game.CurrentTurnIndex ?? game.currentTurnIndex;

    if (prevTurnIdx !== currTurnIdx) {
      const currPlayer = (game.Players ?? game.players)[currTurnIdx];
      const name = currPlayer?.PlayerName ?? currPlayer?.playerName ?? "Unknown";
      // Only notify if it's NOT me (since I have a big "Your Turn" indicator)
      // or maybe just notify everyone for clarity
      if ((currPlayer?.PlayerId ?? currPlayer?.playerId) === userId) {
        addNotification("It's your turn!", "success");
      } else {
        // addNotification(`${name}'s turn`);
      }
    }

    // 2. Capture Detection
    const prevPlayers = prevGame.Players ?? prevGame.players ?? [];
    const currPlayers = game.Players ?? game.players ?? [];
    const prevTableCards = prevGame.TableCards ?? prevGame.tableCards ?? [];
    const currTableCards = game.TableCards ?? game.tableCards ?? [];

    currPlayers.forEach(currP => {
      const pId = currP.PlayerId ?? currP.playerId;
      const prevP = prevPlayers.find(p => (p.PlayerId ?? p.playerId) === pId);

      if (!prevP) return;

      const prevPiles = prevP.CapturePiles ?? prevP.capturePiles ?? [];
      const currPiles = currP.CapturePiles ?? currP.capturePiles ?? [];

      const prevCount = prevPiles.flat().length;
      const currCount = currPiles.flat().length;

      if (currCount > prevCount) {
        const diff = currCount - prevCount;
        const name = currP.PlayerName ?? currP.playerName;

        // Determine Sources
        const sources = [];
        const snatchActions = []; // To trigger multiple animations

        // 1. Check Table
        const tableDiff = Math.max(0, prevTableCards.length - currTableCards.length);
        if (tableDiff > 0) {
          sources.push(`${tableDiff} from Table`);
          snatchActions.push({
            count: tableDiff,
            selector: '.table-cards-slot'
          });
        }

        // 2. Check Other Players (Victims)
        prevPlayers.forEach(oldP => {
          const oldPId = oldP.PlayerId ?? oldP.playerId;
          if (oldPId === pId) return; // Skip self (capturer)

          const newP = currPlayers.find(np => (np.PlayerId ?? np.playerId) === oldPId);
          if (!newP) return;

          const oldPileCount = (oldP.CapturePiles ?? oldP.capturePiles ?? []).flat().length;
          const newPileCount = (newP.CapturePiles ?? newP.capturePiles ?? []).flat().length;

          const lostCount = Math.max(0, oldPileCount - newPileCount);
          if (lostCount > 0) {
            const vName = oldP.PlayerName ?? oldP.playerName;
            sources.push(`${lostCount} from ${vName}`);
            snatchActions.push({
              count: lostCount,
              selector: `[data-player-id="${oldPId}"] .player-avatar`
            });
          }
        });

        // Get Card Details (Top card of the latest pile)
        const latestPile = currPiles[0] ?? [];
        const topCard = latestPile[0] ?? { rank: 0, suit: 0 };

        // Map Rank to Name
        const rankVal = topCard.Rank ?? topCard.rank;
        let rankName = String(rankVal);
        if (rankVal === 1) rankName = "Ace";
        else if (rankVal === 11) rankName = "Jack";
        else if (rankVal === 12) rankName = "Queen";
        else if (rankVal === 13) rankName = "King";

        // Pluralize Rank Name (based on total captured `diff`)
        if (diff > 1) {
          rankName += "s";
        }

        // Construct Message
        let sourceMsg = "";
        if (sources.length === 0) {
          sourceMsg = "from unknown source";
        } else if (sources.length === 1) {
          sourceMsg = sources[0];
        } else {
          sourceMsg = sources.join(", ");
        }

        let finalMsg = `${name} captured ${diff} ${rankName}`;
        if (sources.length > 0) {
          if (sources.length > 1 || sources[0].match(/^\d/)) {
            finalMsg += `: ${sourceMsg}`;
          } else {
            finalMsg += ` from ${sourceMsg}`;
          }
        }

        addNotification(finalMsg + "!", "success");

        // Trigger Animations for each source
        snatchActions.forEach(action => {
          const startEl = document.querySelector(action.selector);
          const playerEl = document.querySelector(`[data-player-id="${pId}"] .player-avatar`);

          if (startEl && playerEl) {
            const startRect = startEl.getBoundingClientRect();
            const playerRect = playerEl.getBoundingClientRect();

            const startPos = {
              x: startRect.left + startRect.width / 2,
              y: startRect.top + startRect.height / 2
            };
            const endPos = {
              x: playerRect.left + playerRect.width / 2,
              y: playerRect.top + playerRect.height / 2
            };

            const animId = Date.now() + Math.random();
            setSnatchAnimations(prev => [...prev, {
              id: animId,
              startPos,
              endPos,
              card: topCard
            }]);
          }
        });
      }
    });

  }, [game, prevGame, userId]);

  const removeAnimation = (id) => {
    setSnatchAnimations(prev => prev.filter(a => a.id !== id));
  };

  // useEffect(() => {
  //   console.log("[game]", game);
  // }, [game]);

  // Map players to 4 positions relative to current user
  const myIndex = players.findIndex(p => (p.PlayerId ?? p.playerId) === userId);
  const getPositionClass = (idx) => {
    const diff = (idx - myIndex + players.length) % players.length;
    if (diff === 0) return "bottom";
    if (diff === 1) return "left";
    if (diff === 2) return "top";
    if (diff === 3) return "right";
    return "";
  };

  // ---------- Drag and Throw Logic ----------
  const [draggingCard, setDraggingCard] = useState(null);
  const [pointerPos, setPointerPos] = useState({ x: 0, y: 0 });
  const [isOverTable, setIsOverTable] = useState(false);

  const handleDragStart = (e, card) => {
    if (!canThrow) return;
    setDraggingCard(card);
    setPointerPos({ x: e.clientX, y: e.clientY });
  };

  const handlePointerMove = (e) => {
    if (!draggingCard) return;
    setPointerPos({ x: e.clientX, y: e.clientY });

    // Check if over table
    const tableEl = document.querySelector(".poker-table");
    if (tableEl) {
      const rect = tableEl.getBoundingClientRect();
      const over =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;
      setIsOverTable(over);
    }
  };

  const handlePointerUp = () => {
    if (!draggingCard) return;

    if (isOverTable) {
      throwCard(gameId, draggingCard);
    }

    setDraggingCard(null);
    setIsOverTable(false);
  };

  return (
    <div
      className="room-screen"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <div className="notifications-container">
        {notifications.map(n => (
          <Notification
            key={n.id}
            message={n.msg}
            type={n.type}
            onClose={() => removeNotification(n.id)}
          />
        ))}
      </div>

      {snatchAnimations.map(a => (
        <CardSnatch
          key={a.id}
          startPos={a.startPos}
          endPos={a.endPos}
          card={a.card}
          onComplete={() => removeAnimation(a.id)}
        />
      ))}
      {draggingCard && (
        <div className="drag-overlay">
          <div
            className="card-ghost"
            style={{
              left: pointerPos.x,
              top: pointerPos.y,
              transform: 'translate(-50%, -50%) rotate(3deg) scale(1.1)'
            }}
          >
            <Card
              rank={draggingCard.Rank ?? draggingCard.rank}
              suit={draggingCard.Suit ?? draggingCard.suit}
            />
          </div>
        </div>
      )}

      <header className="room-header">
        <div className="header-left">
          <h2>Room</h2>
          <div
            className="room-id-badge"
            onClick={() => {
              navigator.clipboard.writeText(gameId);
              addNotification("Room ID copied!", "success");
            }}
            title="Click to copy"
          >
            {gameId.slice(0, 8)}...{gameId.slice(-4)}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </div>
          <div className="deck-count-badge" title="Cards remaining in deck">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
              <line x1="7" y1="2" x2="7" y2="22"></line>
            </svg>
            <span>{deckCount}</span>
          </div>
        </div>

        <div className="header-right">
          <div className={`status-badge ${hubState.status}`}>
            {hubState.status}
          </div>
          <button className="header-leave-btn" onClick={() => leaveGame(gameId)} title="Leave Game">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </button>
        </div>
      </header>

      {/* ===============================
        Winner Overlay
        =============================== */}
      {isEnded && (
        <div className="winner-overlay">
          <div className="winner-card">
            <h2>Game Over</h2>

            {winnerNames.length > 1 ? (
              <>
                <div className="winner-title">Draw</div>
                <div className="winner-names">
                  {winnerNames.join(" • ")}
                </div>
              </>
            ) : (
              <>
                <div className="winner-title">Winner</div>
                <div className="winner-names">
                  {winnerNames[0]}
                </div>
              </>
            )}

            {winningScore != null && (
              <div className="winner-score">
                Score: {winningScore}
              </div>
            )}

            <div className="leaderboard-section">
              <h3>Leaderboard</h3>
              <div className="leaderboard-list">
                {players
                  .map(p => {
                    const piles = p.capturePiles ?? p.CapturePiles ?? [];
                    const calculatedScore = Array.isArray(piles) ? piles.flat().length : 0;
                    const score = p.score ?? calculatedScore;
                    return { ...p, finalScore: score };
                  })
                  .sort((a, b) => b.finalScore - a.finalScore)
                  .map((p, idx) => {
                    const pId = p.PlayerId ?? p.playerId;
                    const isWinner = winnerIds.includes(pId);
                    return (
                      <div key={pId} className={`leaderboard-item ${isWinner ? "winner-row" : ""}`}>
                        <span className="lb-rank">#{idx + 1}</span>
                        <span className="lb-name">{p.PlayerName ?? p.playerName}</span>
                        <span className="lb-score">{p.finalScore}</span>
                      </div>
                    );
                  })}
              </div>
            </div>

            <button className="leave-btn" onClick={() => leaveGame(gameId)}>
              Exit Room
            </button>
          </div>
        </div>
      )}

      <section className="table-area">
        <div className={`poker-table ${isOverTable ? "active-drop-zone" : ""}`}>
          {players.map((p, idx) => {
            const pId = p.PlayerId ?? p.playerId;
            const isTurn = isStarted && (currentPlayer?.PlayerId ?? currentPlayer?.playerId) === pId;

            // Score & Captured Card calculation
            const piles = p.capturePiles ?? p.CapturePiles ?? [];
            const calculatedScore = Array.isArray(piles) ? piles.flat().length : 0;
            const score = p.score ?? calculatedScore;

            const latestPile = Array.isArray(piles) ? piles[0] : null;
            const topCapturedCard = Array.isArray(latestPile) && latestPile.length > 0 ? latestPile[0] : null;

            return (
              <div key={pId} className={`table-player ${getPositionClass(idx)}`} data-player-id={pId}>
                <div className={`player-avatar ${isTurn ? "active-turn" : ""}`}>
                  {p.playerName?.[0]?.toUpperCase() ?? "P"}

                  {topCapturedCard && (
                    <div className="captured-deck-table">
                      <Card
                        rank={topCapturedCard.rank ?? topCapturedCard.Rank}
                        suit={topCapturedCard.suit ?? topCapturedCard.Suit}
                      />
                    </div>
                  )}

                  {/* <div className="score-badge" title="Score">
                    {score}
                  </div> */}
                </div>

                <div className="player-name">
                  {p.PlayerName}
                </div>
                <div className="player-name">
                  {p.PlayerName}
                </div>
              </div>
            );
          })}

          <div className="table-cards-slot">
            <TableCards cards={tableCards} />
          </div>
        </div>
      </section>

      <aside className="room-sidebar">
        <GameChat
          messages={chatMessages}
          onSend={(msg) => sendChatMessage(gameId, msg)}
          currentUserId={userId}
        />

        {hubState.lastError && (
          <div className="error-box">
            <strong>Error:</strong> {hubState.lastError.message}
          </div>
        )}
      </aside>

      <section className="hand-area">
        <div className="turn-indicator">
          {isEnded
            ? "Game finished"
            : isStarted
              ? isMyTurn
                ? "Your turn — throw a card"
                : `Waiting for ${currentPlayer?.PlayerName ?? "player"}…`
              : "Waiting to start..."}
        </div>

        <PlayerHand
          cards={myHand}
          canThrow={canThrow}
          selectedCard={selectedCard}
          onSelect={setSelectedCard}
          onThrow={(card) => throwCard(gameId, card)}
        />
      </section>

      <section className="actions-area">
        {!isStarted && isHost && (
          <button onClick={() => startGame(gameId)}>
            Start Game
          </button>
        )}

        {canThrow && (
          <button
            onClick={() => throwCard(gameId, selectedCard)}
            disabled={!selectedCard}
            className="throw-btn"
          >
            Throw Card
          </button>
        )}
      </section>
    </div>
  );
}
