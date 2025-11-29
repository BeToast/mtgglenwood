import { useState, useEffect, useMemo } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import './Ladder.css';

interface Player {
  uid: string;
  alias: string;
  irlFirstName: string;
  elo: number;
  wins: number;
  losses: number;
  email: string;
}

function Ladder() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlayers();
  }, []);

  const loadPlayers = async () => {
    try {
      const usersCollection = collection(db, 'users');
      const querySnapshot = await getDocs(usersCollection);

      const playersData: Player[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        playersData.push({
          uid: doc.id,
          alias: data.alias || '',
          irlFirstName: data.irlFirstName || '',
          elo: data.elo ?? 1000,
          wins: data.wins ?? 0,
          losses: data.losses ?? 0,
          email: data.email || ''
        });
      });

      // Sort by ELO descending
      playersData.sort((a, b) => b.elo - a.elo);
      setPlayers(playersData);
    } catch (error) {
      console.error('Error loading players:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPlayers = useMemo(() => {
    if (!search.trim()) return players;

    const searchLower = search.toLowerCase();
    return players.filter(player =>
      player.alias.toLowerCase().includes(searchLower) ||
      player.irlFirstName.toLowerCase().includes(searchLower) ||
      player.email.toLowerCase().includes(searchLower)
    );
  }, [players, search]);

  if (loading) {
    return (
      <div className="page ladder-page">
        <div className="ladder-loading">Loading ladder...</div>
      </div>
    );
  }

  return (
    <div className="page ladder-page">
      <div className="ladder-header">
        <h1>Ladder</h1>
        <input
          type="text"
          className="ladder-search"
          placeholder="Search players..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="ladder-table-container">
        <table className="ladder-table">
          <thead>
            <tr>
              <th className="rank-col">Rank</th>
              <th className="alias-col">Alias</th>
              <th className="name-col">First Name</th>
              <th className="elo-col">ELO</th>
              <th className="record-col">W/L</th>
            </tr>
          </thead>
          <tbody>
            {filteredPlayers.length === 0 ? (
              <tr>
                <td colSpan={5} className="no-players">
                  {search ? 'No players found' : 'No players yet'}
                </td>
              </tr>
            ) : (
              filteredPlayers.map((player, index) => (
                <tr key={player.uid}>
                  <td className="rank-col">{index + 1}</td>
                  <td className="alias-col">{player.alias || '—'}</td>
                  <td className="name-col">{player.irlFirstName || '—'}</td>
                  <td className="elo-col">{player.elo}</td>
                  <td className="record-col">
                    {player.wins}/{player.losses}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Ladder;
