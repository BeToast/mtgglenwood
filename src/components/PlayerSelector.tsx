import { useState, useEffect, useMemo } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { type Period } from '../utils/periodCalculator';
import { type MatchCount, getMultiplePlayerMatchCounts } from '../utils/matchCounter';
import './PlayerSelector.css';

export interface Player {
  uid: string;
  email: string;
  alias: string;
  irlFirstName: string;
  elo: number;
}

interface PlayerSelectorProps {
  onSelect: (player: Player) => void;
  onClose: () => void;
  excludeEmail?: string;
  currentPeriod?: Period | null;
}

function PlayerSelector({ onSelect, onClose, excludeEmail, currentPeriod }: PlayerSelectorProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [playerMatchCounts, setPlayerMatchCounts] = useState<Map<string, MatchCount>>(new Map());

  useEffect(() => {
    loadPlayers();
  }, []);

  useEffect(() => {
    if (currentPeriod && players.length > 0) {
      loadMatchCounts();
    }
  }, [currentPeriod, players]);

  const loadPlayers = async () => {
    try {
      const usersCollection = collection(db, 'users');
      const querySnapshot = await getDocs(usersCollection);

      const playersData: Player[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (excludeEmail && data.email === excludeEmail) return;

        playersData.push({
          uid: doc.id,
          email: data.email || '',
          alias: data.alias || '',
          irlFirstName: data.irlFirstName || '',
          elo: data.elo ?? 1000
        });
      });

      playersData.sort((a, b) => b.elo - a.elo);
      setPlayers(playersData);
    } catch (error) {
      console.error('Error loading players:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMatchCounts = async () => {
    if (!currentPeriod) return;

    try {
      const emails = players.map(p => p.email);
      const counts = await getMultiplePlayerMatchCounts(emails, currentPeriod.id, currentPeriod.matchesPerPlayer);
      setPlayerMatchCounts(counts);
    } catch (error) {
      console.error('Error loading match counts:', error);
    }
  };

  const filteredPlayers = useMemo(() => {
    if (!search.trim()) return players;

    const searchLower = search.toLowerCase();
    return players.filter(player =>
      player.alias.toLowerCase().includes(searchLower) ||
      player.irlFirstName.toLowerCase().includes(searchLower)
    );
  }, [players, search]);

  const handleSelect = (player: Player) => {
    onSelect(player);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content player-selector-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Select Player</h2>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <input
          type="text"
          className="player-selector-search"
          placeholder="Search players..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />

        <div className="player-selector-list">
          {loading ? (
            <div className="player-selector-loading">Loading players...</div>
          ) : filteredPlayers.length === 0 ? (
            <div className="no-players-found">No players found</div>
          ) : (
            filteredPlayers.map(player => {
              const matchCount = playerMatchCounts.get(player.email);
              const isDisabled = matchCount?.matchesRemaining === 0;

              return (
                <div
                  key={player.uid}
                  className={`player-selector-item ${isDisabled ? 'disabled' : ''}`}
                  onClick={() => !isDisabled && handleSelect(player)}
                >
                  <div className="player-info">
                    <div className="player-name">
                      {player.alias || player.irlFirstName || 'Unknown'}
                    </div>
                    <div className="player-details">
                      {player.irlFirstName && player.alias && (
                        <span className="player-firstname">{player.irlFirstName}</span>
                      )}
                      {matchCount && (
                        <span className="player-matches">
                          {matchCount.matchesLogged}/{matchCount.periodLimit} matches played
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="player-elo">{player.elo}</div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default PlayerSelector;
