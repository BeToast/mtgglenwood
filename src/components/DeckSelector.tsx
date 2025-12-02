import { useState, useEffect, useMemo } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { type Deck } from './DeckItem';
import './DeckSelector.css';

interface Player {
  uid: string;
  email: string;
  alias: string;
  irlFirstName: string;
  decks: Deck[];
}

interface DeckSelectorProps {
  onSelect: (deck: Deck) => void;
  onClose: () => void;
  ownerId: string;
}

function DeckSelector({ onSelect, onClose, ownerId }: DeckSelectorProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [deckSearch, setDeckSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlayers();
  }, []);

  useEffect(() => {
    if (ownerId && players.length > 0 && !selectedPlayer) {
      const owner = players.find(p => p.uid === ownerId);
      if (owner) {
        setSelectedPlayer(owner);
      }
    }
  }, [ownerId, players, selectedPlayer]);

  const loadPlayers = async () => {
    try {
      const usersCollection = collection(db, 'users');
      const querySnapshot = await getDocs(usersCollection);

      const playersData: Player[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        playersData.push({
          uid: doc.id,
          email: data.email || '',
          alias: data.alias || '',
          irlFirstName: data.irlFirstName || '',
          decks: data.decks || []
        });
      });

      setPlayers(playersData);
    } catch (error) {
      console.error('Error loading players:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDecks = useMemo(() => {
    if (!selectedPlayer) return [];
    if (!deckSearch.trim()) return selectedPlayer.decks;

    const searchLower = deckSearch.toLowerCase();
    return selectedPlayer.decks.filter(deck =>
      deck.name.toLowerCase().includes(searchLower)
    );
  }, [selectedPlayer, deckSearch]);

  const handleDeckSelect = (deck: Deck) => {
    onSelect(deck);
    onClose();
  };

  if (loading || !selectedPlayer) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content deck-selector-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Select Deck</h2>
            <button className="modal-close-btn" onClick={onClose}>✕</button>
          </div>
          <div className="deck-selector-loading">Loading decks...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content deck-selector-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{`Select Deck - ${selectedPlayer.alias || selectedPlayer.irlFirstName}`}</h2>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <input
          type="text"
          className="deck-selector-search"
          placeholder="Search decks..."
          value={deckSearch}
          onChange={(e) => setDeckSearch(e.target.value)}
          autoFocus
        />

        <div className="deck-selector-list">
          {filteredDecks.length === 0 ? (
            <div className="no-items-found">
              {deckSearch ? 'No decks found' : 'This player has no decks'}
            </div>
          ) : (
            filteredDecks.map(deck => (
              <div
                key={deck.id}
                className="deck-selector-item"
                onClick={() => handleDeckSelect(deck)}
              >
                <div className="deck-name">{deck.name}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default DeckSelector;
