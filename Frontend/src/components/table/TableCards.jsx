import Card from "../cards/Card";

export default function TableCards({ cards }) {
  return (
    <div className="table-cards-container">
      {cards.length > 0 ? (
        cards.map((c, i) => (
          <Card
            key={i}
            rank={c.Rank ?? c.rank}
            suit={c.Suit ?? c.suit}
          />
        ))
      ) : (
        <div className="empty-table-msg">Deck is ready...</div>
      )}
    </div>
  );
}
