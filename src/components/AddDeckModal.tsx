import { useState } from 'react';
import './AddDeckModal.css';

interface AddDeckModalProps {
  onSave: (deckName: string, decklistUrl: string) => void;
  onDiscard: () => void;
}

function AddDeckModal({ onSave, onDiscard }: AddDeckModalProps) {
  const [deckName, setDeckName] = useState('');
  const [decklistUrl, setDecklistUrl] = useState('');

  const handleSave = () => {
    if (deckName.trim() && decklistUrl.trim()) {
      onSave(deckName.trim(), decklistUrl.trim());
      setDeckName('');
      setDecklistUrl('');
    }
  };

  const handleDiscard = () => {
    setDeckName('');
    setDecklistUrl('');
    onDiscard();
  };

  return (
    <div className="modal-overlay" onClick={handleDiscard}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>Add Deck</h3>

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
          </div>
        </div>

        <div className="modal-actions">
          <button className="modal-discard-btn" onClick={handleDiscard}>
            Discard
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

export default AddDeckModal;
