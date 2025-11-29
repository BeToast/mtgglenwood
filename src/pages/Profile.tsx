import { useState, useEffect, useMemo } from 'react';
import { signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useUnsavedChanges } from '../context/UnsavedChangesContext';
import DeckItem, { Deck } from '../components/DeckItem';
import AddDeckModal from '../components/AddDeckModal';
import './Profile.css';

interface UserProfile {
  alias: string;
  irlFirstName: string;
  decks: Deck[];
}

function Profile() {
  const { user, loading } = useAuth();
  const { setHasUnsavedChanges, setSaveCallback, setDiscardCallback } = useUnsavedChanges();

  const [alias, setAlias] = useState('');
  const [irlFirstName, setIrlFirstName] = useState('');
  const [decks, setDecks] = useState<Deck[]>([]);
  const [originalAlias, setOriginalAlias] = useState('');
  const [originalIrlFirstName, setOriginalIrlFirstName] = useState('');
  const [originalDecks, setOriginalDecks] = useState<Deck[]>([]);
  const [deckSearch, setDeckSearch] = useState('');
  const [isAddDeckModalOpen, setIsAddDeckModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      loadUserProfile();
    } else {
      setHasUnsavedChanges(false);
      setSaveCallback(null);
      setDiscardCallback(null);
    }
  }, [user]);

  useEffect(() => {
    const hasChanges =
      alias !== originalAlias ||
      irlFirstName !== originalIrlFirstName ||
      JSON.stringify(decks) !== JSON.stringify(originalDecks);

    setHasUnsavedChanges(hasChanges);

    if (hasChanges) {
      setSaveCallback(() => saveUserProfile);
      setDiscardCallback(() => discardChanges);
    } else {
      setSaveCallback(null);
      setDiscardCallback(null);
    }
  }, [alias, irlFirstName, decks, originalAlias, originalIrlFirstName, originalDecks]);

  const filteredDecks = useMemo(() => {
    if (!deckSearch.trim()) return decks;
    return decks.filter(deck =>
      deck.name.toLowerCase().includes(deckSearch.toLowerCase())
    );
  }, [decks, deckSearch]);

  const loadUserProfile = async () => {
    if (!user) return;

    try {
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as UserProfile;
        const loadedAlias = data.alias || '';
        const loadedFirstName = data.irlFirstName || '';
        const loadedDecks = data.decks || [];

        setAlias(loadedAlias);
        setIrlFirstName(loadedFirstName);
        setDecks(loadedDecks);
        setOriginalAlias(loadedAlias);
        setOriginalIrlFirstName(loadedFirstName);
        setOriginalDecks(loadedDecks);
      } else {
        setOriginalAlias('');
        setOriginalIrlFirstName('');
        setOriginalDecks([]);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const saveUserProfile = async () => {
    if (!user) return;

    try {
      const docRef = doc(db, 'users', user.uid);
      await setDoc(docRef, {
        alias,
        irlFirstName,
        decks,
        email: user.email,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      setOriginalAlias(alias);
      setOriginalIrlFirstName(irlFirstName);
      setOriginalDecks(decks);
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  const discardChanges = () => {
    setAlias(originalAlias);
    setIrlFirstName(originalIrlFirstName);
    setDecks(originalDecks);
  };

  const addDeck = (deckName: string, decklistUrl: string) => {
    const newDeck: Deck = {
      id: Date.now().toString(),
      name: deckName,
      decklistUrl,
    };
    setDecks([...decks, newDeck]);
    setIsAddDeckModalOpen(false);
  };

  const deleteDeck = (id: string) => {
    setDecks(decks.filter(deck => deck.id !== id));
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Error signing in with Google:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setAlias('');
      setIrlFirstName('');
      setDecks([]);
      setOriginalAlias('');
      setOriginalIrlFirstName('');
      setOriginalDecks([]);
      setHasUnsavedChanges(false);
      setSaveCallback(null);
      setDiscardCallback(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <div className="page profile-page">
        <div className="profile-loading">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="page profile-page">
        <div className="login-container">
          <button className="google-login-btn" onClick={handleGoogleSignIn}>
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page profile-page">
      <div className="profile-content">
        <div className="profile-header">
          {user.photoURL && (
            <img src={user.photoURL} alt="Profile" className="profile-avatar" />
          )}
          <h2>{user.displayName}</h2>
          <p className="profile-email">{user.email}</p>
        </div>

        <div className="profile-form">
          <div className="form-group">
            <label htmlFor="alias">Alias</label>
            <input
              id="alias"
              type="text"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              placeholder="Enter your alias"
            />
          </div>

          <div className="form-group">
            <label htmlFor="irlFirstName">IRL First Name</label>
            <input
              id="irlFirstName"
              type="text"
              value={irlFirstName}
              onChange={(e) => setIrlFirstName(e.target.value)}
              placeholder="Enter your first name"
            />
          </div>
        </div>

        <div className="decks-section">
          <h3>Decks</h3>
          <input
            type="text"
            className="deck-search"
            placeholder="Search decks..."
            value={deckSearch}
            onChange={(e) => setDeckSearch(e.target.value)}
          />
          <div className="decks-list">
            {filteredDecks.map(deck => (
              <DeckItem key={deck.id} deck={deck} onDelete={deleteDeck} />
            ))}
            <button
              className="add-deck-btn"
              onClick={() => setIsAddDeckModalOpen(true)}
            >
              + Add Deck
            </button>
          </div>
        </div>

        <button className="sign-out-btn" onClick={handleSignOut}>
          Sign Out
        </button>
      </div>

      {isAddDeckModalOpen && (
        <AddDeckModal
          onSave={addDeck}
          onDiscard={() => setIsAddDeckModalOpen(false)}
        />
      )}
    </div>
  );
}

export default Profile;
