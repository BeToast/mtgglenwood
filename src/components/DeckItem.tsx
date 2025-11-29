import './DeckItem.css';

export interface Deck {
  id: string;
  name: string;
  decklistUrl: string;
}

interface DeckItemProps {
  deck: Deck;
  onDelete: (id: string) => void;
}

function DeckItem({ deck, onDelete }: DeckItemProps) {
  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    onDelete(deck.id);
  };

  return (
    <div className="deck-item">
      <div className="deck-info">
        <a
          href={deck.decklistUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="deck-name"
        >
          {deck.name}
        </a>
        <span className="deck-url">{deck.decklistUrl}</span>
      </div>
      <button className="deck-delete-btn" onClick={handleDelete}>
        ✕
      </button>
    </div>
  );
}

export default DeckItem;
