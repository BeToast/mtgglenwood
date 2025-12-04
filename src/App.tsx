import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
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
    if (!user?.email) return;

    const unapprovedCollection = collection(db, 'unapprovedMatches');
    let player1Match: UnapprovedMatch | null = null;
    let player2Match: UnapprovedMatch | null = null;

    // Listen for matches where user is player 1 and hasn't approved yet
    const q1 = query(
      unapprovedCollection,
      where('player1Email', '==', user.email),
      where('p1Approval', '==', false)
    );

    // Listen for matches where user is player 2 and hasn't approved yet
    const q2 = query(
      unapprovedCollection,
      where('player2Email', '==', user.email),
      where('p2Approval', '==', false)
    );

    const updatePendingMatch = () => {
      setPendingMatch(player1Match || player2Match || null);
    };

    // Set up real-time listeners
    const unsubscribe1 = onSnapshot(q1, (snapshot) => {
      player1Match = snapshot.empty ? null : ({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as UnapprovedMatch);
      updatePendingMatch();
    });

    const unsubscribe2 = onSnapshot(q2, (snapshot) => {
      player2Match = snapshot.empty ? null : ({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as UnapprovedMatch);
      updatePendingMatch();
    });

    // Cleanup both listeners on unmount or user change
    return () => {
      unsubscribe1();
      unsubscribe2();
    };
  }, [user]);

  const handleApprovalComplete = () => {
    setPendingMatch(null);
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
