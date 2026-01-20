import "./Card.css";

const SUIT_MAP = {
  1: "♠",
  2: "♥",
  3: "♦",
  4: "♣",

  Spades: "♠",
  Hearts: "♥",
  Diamonds: "♦",
  Clubs: "♣"
};

const RANK_MAP = {
  1: "A",
  11: "J",
  12: "Q",
  13: "K"
};

export default function Card({ rank, suit, selectable, selected, dragging, onDragStart, onDragEnd, onClick }) {
  const displayRank = RANK_MAP[rank] ?? rank;
  const symbol = SUIT_MAP[suit] ?? suit;
  const isRed = symbol === "♥" || symbol === "♦";

  return (
    <div
      className={`card ${isRed ? "red" : "black"} ${selectable ? "selectable" : ""
        } ${selected ? "selected" : ""} ${dragging ? "dragging" : ""}`}
      onClick={selectable ? onClick : undefined}
      onPointerDown={selectable && onDragStart ? (e) => onDragStart(e) : undefined}
      onPointerUp={selectable && onDragEnd ? (e) => onDragEnd(e) : undefined}
    >
      <div className="card-corner top-left">
        <span>{displayRank}</span>
        <span>{symbol}</span>
      </div>

      <div className="card-center">{symbol}</div>

      <div className="card-corner bottom-right">
        <span>{displayRank}</span>
        <span>{symbol}</span>
      </div>
    </div>
  );
}
