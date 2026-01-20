import { useState } from "react";
import { useGame } from "../game/GameContext";
import Room from "./Room";
import "./Lobby.css";

export default function Lobby() {
  const { userId, hubState, gameState, createGame, joinGame } = useGame();

  const [username, setUsername] = useState("");
  const [joinGameId, setJoinGameId] = useState("");

  const { activeGameId, createdGameId, game } = gameState;

  const canUseHub = hubState.status === "connected";

  if (activeGameId) {
    return <Room />;
  }

  return (
    <div className="lobby-screen">
      <div className="bg-decorations">
        <div className="decor-suit decor-1">♠</div>
        <div className="decor-suit decor-2">♥</div>
        <div className="decor-suit decor-3">♦</div>
        <div className="decor-suit decor-4">♣</div>
      </div>

      <header className="lobby-header">
        <h1>Daketi</h1>
        <div className={`status-badge ${hubState.status}`}>
          Hub: {hubState.status}
        </div>
      </header>

      <section className="identity-section">
        <div className="profile-card">
          <div className="profile-info">
            <span className="profile-label">Player Identity</span>
            <h3>{username || "Guest Player"}</h3>
          </div>
          <input
            className="identity-input"
            placeholder="Enter your name..."
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
      </section>

      <section className="lobby-content">
        <div className="lobby-card">
          <div className="card-info">
            <h3>Start a New Game</h3>
            <p className="text-dim">Create a room and invite your friends</p>
          </div>

          <div className="card-inputs">
            <button
              onClick={() => createGame()}
              disabled={!canUseHub || !username}
            >
              Create Room
            </button>
          </div>

          {createdGameId && (
            <div className="created-room-info">
              <p><strong>Room ID (Share this):</strong></p>
              <code>{createdGameId}</code>
            </div>
          )}
        </div>

        <div className="lobby-card">
          <div className="card-info">
            <h3>Join Existing Game</h3>
            <p className="text-dim">Paste a Room ID to start playing</p>
          </div>

          <div className="card-inputs">
            <input
              placeholder="Paste Room ID"
              value={joinGameId}
              onChange={(e) => setJoinGameId(e.target.value)}
            />

            <button
              onClick={() => joinGame(joinGameId, username)}
              disabled={!canUseHub || !username || !joinGameId}
            >
              Join Room
            </button>
          </div>
        </div>
      </section>

      <section className="debug-section">
        <h3>Network Info</h3>
        <p><strong>Connection ID:</strong> {hubState.connectionId || "N/A"}</p>
        <p><strong>User ID:</strong> {userId}</p>

        {hubState.lastError && (
          <pre className="error-log">
            {String(hubState.lastError?.message ?? hubState.lastError)}
          </pre>
        )}

        {/* {game && (
          <div className="debug-snapshot">
            <h4>Last Game Snapshot:</h4>
            <pre>{JSON.stringify(game, null, 2)}</pre>
          </div>
        )} */}
      </section>
    </div>
  );
}
