import Card from "../cards/Card";

export default function PlayerHand({
  cards,
  canThrow,
  selectedCard,
  onSelect,
  draggingId,
  onDragStart,
  onDragEnd,
  onThrow
}) {
  return (
    <div className="player-hand-container">
      <div className="hand-cards">
        {cards.map((c, i) => {
          const rank = c.Rank ?? c.rank;
          const suit = c.Suit ?? c.suit;
          const cardId = `${rank}-${suit}`;
          const selected =
            selectedCard &&
            (selectedCard.Rank ?? selectedCard.rank) === rank &&
            (selectedCard.Suit ?? selectedCard.suit) === suit;

          const isDragging = draggingId === cardId;
          const rotation = (i - (cards.length - 1) / 2) * 5;
          const translateY = Math.abs(i - (cards.length - 1) / 2) * 2;

          return (
            <div
              key={cardId}
              className="hand-card-wrapper"
              style={{
                transform: `rotate(${rotation}deg) translateY(${translateY}px)`,
                marginLeft: i > 0 ? '-30px' : '0',
                visibility: isDragging ? 'hidden' : 'visible'
              }}
            >
              <Card
                rank={rank}
                suit={suit}
                selectable={canThrow}
                selected={selected}
                dragging={isDragging}
                onDragStart={(e) => onDragStart && onDragStart(e, c)}
                onDragEnd={onDragEnd}
                onClick={() => onSelect(c)}
                onDoubleClick={() => onThrow && onThrow(c)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
