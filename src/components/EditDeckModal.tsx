import { useState } from 'react';
import { type Deck } from './DeckItem';
import './AddDeckModal.css';

interface EditDeckModalProps {
  deck: Deck;
  onSave: (id: string, deckName: string, decklistUrl: string) => void;
  onDiscard: () => void;
}

function EditDeckModal({ deck, onSave, onDiscard }: EditDeckModalProps) {
  const [deckName, setDeckName] = useState(deck.name);
  const [decklistUrl, setDecklistUrl] = useState(deck.decklistUrl);

  const handleSave = () => {
    if (deckName.trim() && decklistUrl.trim()) {
      onSave(deck.id, deckName.trim(), decklistUrl.trim());
      onDiscard();
    }
  };

  return (
    <div className="modal-overlay" onClick={onDiscard}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>Edit Deck</h3>

        <div className="modal-form">
          <div className="form-group">
            <label htmlFor="deckName">Deck Name</label>
            <input
              id="deckName"
              type="text"
              value={deckName}
              onChange={(e) => setDeckName(e.target.value)}
              placeholder="Enter deck name"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="decklistUrl">Decklist URL</label>
            <input
              id="decklistUrl"
              type="url"
              value={decklistUrl}
              onChange={(e) => setDecklistUrl(e.target.value)}
              placeholder="Enter decklist URL"
            />
            {decklistUrl && (
              <button
                type="button"
                className="open-url-btn"
                onClick={() => window.open(decklistUrl, '_blank')}
                style={{
                  marginTop: '8px',
                  padding: '6px 12px',
                  backgroundColor: 'transparent',
                  color: '#4A90E2',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  textDecoration: 'underline'
                }}
              >
                Open URL
              </button>
            )}
          </div>
        </div>

        <div className="modal-actions">
          <button className="modal-discard-btn" onClick={onDiscard}>
            Cancel
          </button>
          <button
            className="modal-save-btn"
            onClick={handleSave}
            disabled={!deckName.trim() || !decklistUrl.trim()}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditDeckModal;
