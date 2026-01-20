import Card from "../cards/Card";

export default function CaptureSummary({
  player,
  label,
  showName = true,
  emptyText = "No captures"
}) {
  if (!player) return null;

  const piles =
    player.capturePiles ??
    player.CapturePiles ??
    [];

  if (!Array.isArray(piles) || piles.length === 0) {
    return (
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {showName && (
          <strong>
            {label ?? player.PlayerName ?? player.playerName}
          </strong>
        )}
        <span style={{ color: "gray" }}>{emptyText}</span>
      </div>
    );
  }

  const latestPile = piles[0];
  if (!Array.isArray(latestPile) || latestPile.length === 0) return null;

  const latestCaptured = latestPile[0];

  return (
    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
      {showName && (
        <strong>
          {label ?? player.PlayerName ?? player.playerName}
        </strong>
      )}

      <Card
        rank={latestCaptured.rank ?? latestCaptured.Rank}
        suit={latestCaptured.suit ?? latestCaptured.Suit}
      />
    </div>
  );
}
