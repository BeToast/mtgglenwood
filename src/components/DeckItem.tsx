import './DeckItem.css';

export interface Deck {
  id: string;
  name: string;
  decklistUrl: string;
}

interface DeckItemProps {
  deck: Deck;
  onDelete: (id: string) => void;
  onClick?: (deck: Deck) => void;
}

function DeckItem({ deck, onDelete, onClick }: DeckItemProps) {
  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete(deck.id);
  };

  const handleClick = () => {
    if (onClick) {
      onClick(deck);
    }
  };

  return (
    <div className="deck-item" onClick={handleClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <div className="deck-info">
        <span className="deck-name">{deck.name}</span>
        <span className="deck-url">{deck.decklistUrl}</span>
      </div>
      <button className="deck-delete-btn" onClick={handleDelete}>
        ✕
      </button>
    </div>
  );
}

export default DeckItem;
