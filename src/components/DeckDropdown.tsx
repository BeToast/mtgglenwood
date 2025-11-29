import { useState, useRef, useEffect } from 'react';
import { type Deck } from './DeckItem';
import './DeckDropdown.css';

interface DeckDropdownProps {
  decks: Deck[];
  selectedDeck: Deck | null;
  onSelect: (deck: Deck | null) => void;
  placeholder?: string;
}

function DeckDropdown({ decks, selectedDeck, onSelect, placeholder = 'Select deck...' }: DeckDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const filteredDecks = search.trim()
    ? decks.filter(deck => deck.name.toLowerCase().includes(search.toLowerCase()))
    : decks;

  const handleSelect = (deck: Deck) => {
    onSelect(deck);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div className="deck-dropdown" ref={dropdownRef}>
      <div
        className="deck-dropdown-trigger"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={selectedDeck ? 'selected-value' : 'placeholder-value'}>
          {selectedDeck?.name || placeholder}
        </span>
        <span className="dropdown-arrow">{isOpen ? '▲' : '▼'}</span>
      </div>

      {isOpen && (
        <div className="deck-dropdown-menu">
          <input
            type="text"
            className="deck-dropdown-search"
            placeholder="Search decks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />

          <div className="deck-dropdown-list">
            {filteredDecks.length === 0 ? (
              <div className="no-decks-message">
                {search ? 'No decks found' : 'No decks available'}
              </div>
            ) : (
              filteredDecks.map(deck => (
                <div
                  key={deck.id}
                  className={`deck-dropdown-item ${selectedDeck?.id === deck.id ? 'selected' : ''}`}
                  onClick={() => handleSelect(deck)}
                >
                  {deck.name}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default DeckDropdown;
