import { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import LogMatchModal from '../components/LogMatchModal';
import './Matches.css';

interface Match {
  id: string;
  player1Email: string;
  player1FirstName: string;
  player1DeckName: string;
  player1Wins: number;
  player1EloChange: number;
  player2Email: string;
  player2FirstName: string;
  player2DeckName: string;
  player2Wins: number;
  player2EloChange: number;
  timeCreated: string;
}

function Matches() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isLogMatchModalOpen, setIsLogMatchModalOpen] = useState(false);

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      const matchesCollection = collection(db, 'matches');
      const q = query(matchesCollection, orderBy('timeCreated', 'desc'));
      const querySnapshot = await getDocs(q);

      const matchesData: Match[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        matchesData.push({
          id: doc.id,
          player1Email: data.player1Email,
          player1FirstName: data.player1FirstName,
          player1DeckName: data.player1DeckName,
          player1Wins: data.player1Wins,
          player1EloChange: data.player1EloChange,
          player2Email: data.player2Email,
          player2FirstName: data.player2FirstName,
          player2DeckName: data.player2DeckName,
          player2Wins: data.player2Wins,
          player2EloChange: data.player2EloChange,
          timeCreated: data.timeCreated
        });
      });

      setMatches(matchesData);
    } catch (error) {
      console.error('Error loading matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMatches = useMemo(() => {
    if (!search.trim()) return matches;

    const searchLower = search.toLowerCase();
    return matches.filter(match =>
      match.player1FirstName.toLowerCase().includes(searchLower) ||
      match.player2FirstName.toLowerCase().includes(searchLower) ||
      match.player1DeckName.toLowerCase().includes(searchLower) ||
      match.player2DeckName.toLowerCase().includes(searchLower)
    );
  }, [matches, search]);

  const handleMatchLogged = () => {
    setIsLogMatchModalOpen(false);
    loadMatches();
  };

  if (loading) {
    return (
      <div className="page matches-page">
        <div className="matches-loading">Loading matches...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="page matches-page">
        <div className="matches-login-prompt">
          Please sign in to view matches
        </div>
      </div>
    );
  }

  return (
    <div className="page matches-page">
      <div className="matches-header">
        <h1>Matches</h1>
        <input
          type="text"
          className="matches-search"
          placeholder="Search matches..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="matches-list">
        {filteredMatches.length === 0 ? (
          <div className="no-matches">
            {search ? 'No matches found' : 'No matches yet'}
          </div>
        ) : (
          filteredMatches.map((match) => {
            const isPlayer1Winner = match.player1Wins > match.player2Wins;
            const winner = isPlayer1Winner ? {
              name: match.player1FirstName,
              deck: match.player1DeckName,
              eloChange: match.player1EloChange
            } : {
              name: match.player2FirstName,
              deck: match.player2DeckName,
              eloChange: match.player2EloChange
            };
            const loser = isPlayer1Winner ? {
              name: match.player2FirstName,
              deck: match.player2DeckName,
              eloChange: match.player2EloChange
            } : {
              name: match.player1FirstName,
              deck: match.player1DeckName,
              eloChange: match.player1EloChange
            };

            const winnerWins = isPlayer1Winner ? match.player1Wins : match.player2Wins;
            const loserWins = isPlayer1Winner ? match.player2Wins : match.player1Wins;

            return (
              <div key={match.id} className="match-item">
                <div className="match-result winner">
                  <div className="match-wins">
                    {Array.from({ length: winnerWins }).map((_, i) => (
                      <span key={i} className="win-check">✓</span>
                    ))}
                  </div>
                  <span className="player-name">{winner.name}</span>
                  <span className="deck-name">{winner.deck}</span>
                  <span className="elo-change">+{winner.eloChange}</span>
                </div>
                <div className="match-result loser">
                  <div className="match-wins">
                    {Array.from({ length: loserWins }).map((_, i) => (
                      <span key={i} className="win-check">✓</span>
                    ))}
                  </div>
                  <span className="player-name">{loser.name}</span>
                  <span className="deck-name">{loser.deck}</span>
                  <span className="elo-change">{loser.eloChange}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      <button
        className="log-match-btn"
        onClick={() => setIsLogMatchModalOpen(true)}
      >
        Log Match
      </button>

      {isLogMatchModalOpen && (
        <LogMatchModal
          onSave={handleMatchLogged}
          onDiscard={() => setIsLogMatchModalOpen(false)}
        />
      )}
    </div>
  );
}

export default Matches;
