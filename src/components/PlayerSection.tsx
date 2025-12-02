import { type Player } from './PlayerSelector';
import { type Deck } from './DeckItem';

interface PlayerSectionProps {
  title: string;
  player: Player | null;
  deckOwner: Player | null;
  selectedDeck: Deck | null;
  wins: number;
  onDeckOwnerClick: () => void;
  onDeckClick: () => void;
  onWinsChange: (wins: number) => void;
  showPlayerSelector?: boolean;
  onPlayerClick?: () => void;
}

function PlayerSection({
  title,
  player,
  deckOwner,
  selectedDeck,
  wins,
  onDeckOwnerClick,
  onDeckClick,
  onWinsChange,
  showPlayerSelector = false,
  onPlayerClick
}: PlayerSectionProps) {
  return (
    <div className="player-section">
      <h3>{title}</h3>

      {showPlayerSelector && onPlayerClick && (
        <>
          <label>Who did you play against?</label>
          <div
            className="player-display clickable"
            onClick={onPlayerClick}
          >
            {player ? (
              <span>{player.alias || player.irlFirstName || player.email}</span>
            ) : (
              <span className="placeholder">Select player...</span>
            )}
          </div>
        </>
      )}

      <label>Whose deck did you play with?</label>
      <div
        className="player-display clickable"
        onClick={onDeckOwnerClick}
      >
        {deckOwner ? (
          <span>{deckOwner.alias || deckOwner.irlFirstName || deckOwner.email}</span>
        ) : (
          <span className="placeholder">Select player...</span>
        )}
      </div>

      <label>Deck</label>
      <div
        className="player-display clickable"
        onClick={() => deckOwner && onDeckClick()}
      >
        {selectedDeck ? (
          <span>{selectedDeck.name}</span>
        ) : (
          <span className="placeholder">Select deck...</span>
        )}
      </div>

      <label>Wins</label>
      <div className="wins-checkboxes">
        {[0, 1].map(num => (
          <label key={num} className="checkbox-label">
            <input
              type="checkbox"
              checked={wins >= num + 1}
              onChange={() => onWinsChange(
                wins >= num + 1 ? num : num + 1
              )}
            />
            {num + 1}
          </label>
        ))}
      </div>
    </div>
  );
}

export default PlayerSection;
