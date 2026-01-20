import CaptureSummary from "./CaptureSummary";

export default function PlayerList({ players, currentPlayerId, userId }) {
  if (!Array.isArray(players)) return null;

  return (
    <div className="player-list-container">
      {players.map((p, index) => {
        if (!p) return null;

        const pid = p.PlayerId ?? p.playerId;
        if (!pid) return null;

        const isMe = pid === userId;
        const isTurn = pid === currentPlayerId;

        return (
          <div key={pid ?? index} className={`player-item ${isTurn ? "active-item" : ""}`}>
            <CaptureSummary
              player={p}
              label={isMe ? "You" : undefined}
            />
            {isTurn && <span className="turn-badge">Turn</span>}
          </div>
        );
      })}
    </div>
  );
}
