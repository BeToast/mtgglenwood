import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { AuthProvider } from './context/AuthContext';
import { UnsavedChangesProvider } from './context/UnsavedChangesContext';
import { useAuth } from './context/AuthContext';
import { db } from './firebase';
import Home from './pages/Home';
import Ladder from './pages/Ladder';
import Matches from './pages/Matches';
import Profile from './pages/Profile';
import Schedule from './pages/Schedule';
import NavigationBar from './components/NavigationBar';
import MatchApprovalModal from './components/MatchApprovalModal';
import './App.css';

interface UnapprovedMatch {
  id: string;
  player1Email: string;
  player1DeckId: string;
  player1Wins: number;
  player2Email: string;
  player2DeckId: string;
  player2Wins: number;
  p1Approval: boolean;
  p2Approval: boolean;
  timeCreated: string;
}

function AppContent() {
  const { user } = useAuth();
  const [pendingMatch, setPendingMatch] = useState<UnapprovedMatch | null>(null);

  useEffect(() => {
    if (user?.email) {
      checkForPendingMatches();
    }
  }, [user]);

  const checkForPendingMatches = async () => {
    if (!user?.email) return;

    try {
      const unapprovedCollection = collection(db, 'unapprovedMatches');

      // Check for matches where user is player 1 and hasn't approved yet
      const q1 = query(
        unapprovedCollection,
        where('player1Email', '==', user.email),
        where('p1Approval', '==', false)
      );

      // Check for matches where user is player 2 and hasn't approved yet
      const q2 = query(
        unapprovedCollection,
        where('player2Email', '==', user.email),
        where('p2Approval', '==', false)
      );

      const [snapshot1, snapshot2] = await Promise.all([
        getDocs(q1),
        getDocs(q2)
      ]);

      if (!snapshot1.empty) {
        const doc = snapshot1.docs[0];
        setPendingMatch({ id: doc.id, ...doc.data() } as UnapprovedMatch);
      } else if (!snapshot2.empty) {
        const doc = snapshot2.docs[0];
        setPendingMatch({ id: doc.id, ...doc.data() } as UnapprovedMatch);
      }
    } catch (error) {
      console.error('Error checking for pending matches:', error);
    }
  };

  const handleApprovalComplete = () => {
    setPendingMatch(null);
    checkForPendingMatches();
  };

  return (
    <Router>
      <div className="app">
        <div className="content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/ladder" element={<Ladder />} />
            <Route path="/matches" element={<Matches />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/schedule" element={<Schedule />} />
          </Routes>
        </div>
        <NavigationBar />

        {pendingMatch && user?.email && (
          <MatchApprovalModal
            match={pendingMatch}
            currentUserEmail={user.email}
            onComplete={handleApprovalComplete}
          />
        )}
      </div>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <UnsavedChangesProvider>
        <AppContent />
      </UnsavedChangesProvider>
    </AuthProvider>
  );
}

export default App;
