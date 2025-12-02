import { useState, useEffect, useMemo } from "react";
import {
   signInWithPopup,
   signOut,
   signInWithEmailAndPassword,
   createUserWithEmailAndPassword,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, googleProvider, db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { useUnsavedChanges } from "../context/UnsavedChangesContext";
import DeckItem, { type Deck } from "../components/DeckItem";
import AddDeckModal from "../components/AddDeckModal";
import EditDeckModal from "../components/EditDeckModal";
import CreateAccountModal from "../components/CreateAccountModal";
import { type Period, getAllPeriods, getCurrentPeriod, formatPeriodTime } from "../utils/periodCalculator";
import { type MatchCount, getPlayerMatchCount } from "../utils/matchCounter";
import "./Profile.css";

interface UserProfile {
   alias: string;
   irlFirstName: string;
   decks: Deck[];
   elo: number;
   points: number;
   wins: number;
   losses: number;
}

function Profile() {
   const { user, loading } = useAuth();
   const { setHasUnsavedChanges, setSaveCallback, setDiscardCallback } =
      useUnsavedChanges();

   const [alias, setAlias] = useState("");
   const [irlFirstName, setIrlFirstName] = useState("");
   const [decks, setDecks] = useState<Deck[]>([]);
   const [points, setPoints] = useState<number | null>(null);
   const [wins, setWins] = useState<number | null>(null);
   const [losses, setLosses] = useState<number | null>(null);
   const [elo, setElo] = useState<number | null>(null);
   const [statsLoading, setStatsLoading] = useState(true);
   const [originalAlias, setOriginalAlias] = useState("");
   const [originalIrlFirstName, setOriginalIrlFirstName] = useState("");
   const [originalDecks, setOriginalDecks] = useState<Deck[]>([]);
   const [deckSearch, setDeckSearch] = useState("");
   const [isAddDeckModalOpen, setIsAddDeckModalOpen] = useState(false);
   const [editingDeck, setEditingDeck] = useState<Deck | null>(null);
   const [email, setEmail] = useState("");
   const [password, setPassword] = useState("");
   const [authError, setAuthError] = useState<string | null>(null);
   const [showCreateAccountModal, setShowCreateAccountModal] = useState(false);
   const [pendingCredentials, setPendingCredentials] = useState<{
      email: string;
      password: string;
   } | null>(null);
   const [currentPeriod, setCurrentPeriod] = useState<Period | null>(null);
   const [nextPeriod, setNextPeriod] = useState<Period | null>(null);
   const [matchCount, setMatchCount] = useState<MatchCount | null>(null);

   useEffect(() => {
      if (user) {
         loadUserProfile();
         loadPeriodInfo();
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
   }, [
      alias,
      irlFirstName,
      decks,
      originalAlias,
      originalIrlFirstName,
      originalDecks,
   ]);

   const filteredDecks = useMemo(() => {
      if (!deckSearch.trim()) return decks;
      return decks.filter((deck) =>
         deck.name.toLowerCase().includes(deckSearch.toLowerCase())
      );
   }, [decks, deckSearch]);

   const loadUserProfile = async () => {
      if (!user) return;

      try {
         const docRef = doc(db, "users", user.uid);
         const docSnap = await getDoc(docRef);

         if (docSnap.exists()) {
            const data = docSnap.data() as UserProfile;
            const loadedAlias = data.alias || "";
            const loadedFirstName = data.irlFirstName || "";
            const loadedDecks = data.decks || [];
            const loadedPoints = data.points ?? 0;
            const loadedWins = data.wins ?? 0;
            const loadedLosses = data.losses ?? 0;
            const loadedElo = data.elo ?? 1069;

            setAlias(loadedAlias);
            setIrlFirstName(loadedFirstName);
            setDecks(loadedDecks);
            setElo(loadedElo);
            setPoints(loadedPoints);
            setWins(loadedWins);
            setLosses(loadedLosses);
            setOriginalAlias(loadedAlias);
            setOriginalIrlFirstName(loadedFirstName);
            setOriginalDecks(loadedDecks);
            setStatsLoading(false);
         } else {
            // First time OAuth - initialize with default values
            const defaultElo = 1069;
            const defaultWins = 0;
            const defaultLosses = 0;
            const defaultPoints = 0;

            await setDoc(docRef, {
               alias: "",
               irlFirstName: "",
               decks: [],
               elo: defaultElo,
               points: defaultPoints,
               wins: defaultWins,
               losses: defaultLosses,
               email: user.email,
               admin: false,
               createdAt: new Date().toISOString(),
               updatedAt: new Date().toISOString(),
            });

            setElo(defaultElo);
            setPoints(defaultPoints);
            setWins(defaultWins);
            setLosses(defaultLosses);
            setOriginalAlias("");
            setOriginalIrlFirstName("");
            setOriginalDecks([]);
            setStatsLoading(false);
         }
      } catch (error) {
         console.error("Error loading profile:", error);
         setStatsLoading(false);
      }
   };

   const loadPeriodInfo = async () => {
      if (!user?.email) return;

      try {
         const periods = await getAllPeriods();
         if (periods.length === 0) return;

         const current = getCurrentPeriod(periods);
         setCurrentPeriod(current);

         if (current) {
            // Find next period (chronologically after current)
            const currentIndex = periods.findIndex(p => p.id === current.id);
            const next = currentIndex >= 0 && currentIndex < periods.length - 1
               ? periods[currentIndex + 1]
               : periods[0]; // Wrap around to first period
            setNextPeriod(next);

            // Load match count for current period
            const count = await getPlayerMatchCount(user.email, current.id, current.matchesPerPlayer);
            setMatchCount(count);
         }
      } catch (error) {
         console.error("Error loading period info:", error);
      }
   };

   const saveUserProfile = async () => {
      if (!user) return;

      try {
         const docRef = doc(db, "users", user.uid);
         await setDoc(
            docRef,
            {
               alias,
               irlFirstName,
               decks,
               elo,
               wins,
               losses,
               email: user.email,
               updatedAt: new Date().toISOString(),
            },
            { merge: true }
         );

         setOriginalAlias(alias);
         setOriginalIrlFirstName(irlFirstName);
         setOriginalDecks(decks);
      } catch (error) {
         console.error("Error saving profile:", error);
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
      setDecks(decks.filter((deck) => deck.id !== id));
   };

   const updateDeck = (id: string, deckName: string, decklistUrl: string) => {
      setDecks(
         decks.map((deck) =>
            deck.id === id ? { ...deck, name: deckName, decklistUrl } : deck
         )
      );
      setEditingDeck(null);
   };

   const handleGoogleSignIn = async () => {
      try {
         await signInWithPopup(auth, googleProvider);
      } catch (error) {
         console.error("Error signing in with Google:", error);
      }
   };

   const handleEmailPasswordLogin = async () => {
      setAuthError(null);

      if (!email.trim() || !password.trim()) {
         setAuthError("Email and password are required");
         return;
      }

      try {
         await signInWithEmailAndPassword(auth, email.trim(), password.trim());
      } catch (error: any) {
         if (
            error.code === "auth/user-not-found" ||
            error.code === "auth/invalid-credential"
         ) {
            setPendingCredentials({
               email: email.trim(),
               password: password.trim(),
            });
            setShowCreateAccountModal(true);
         } else if (error.code === "auth/wrong-password") {
            setAuthError("Incorrect password");
         } else if (error.code === "auth/invalid-email") {
            setAuthError("Invalid email format");
         } else {
            setAuthError("Login failed: " + error.message);
         }
      }
   };

   const handleCreateAccount = async () => {
      if (!pendingCredentials) return;

      try {
         await createUserWithEmailAndPassword(
            auth,
            pendingCredentials.email,
            pendingCredentials.password
         );

         setShowCreateAccountModal(false);
         setPendingCredentials(null);
         setEmail("");
         setPassword("");
         setAuthError(null);
      } catch (error: any) {
         setShowCreateAccountModal(false);
         setPendingCredentials(null);

         if (error.code === "auth/email-already-in-use") {
            setAuthError("Email already in use");
         } else if (error.code === "auth/weak-password") {
            setAuthError("Password too weak");
         } else {
            setAuthError("Account creation failed: " + error.message);
         }
      }
   };

   const handleCancelCreateAccount = () => {
      setShowCreateAccountModal(false);
      setPendingCredentials(null);
   };

   const handleSignOut = async () => {
      try {
         await signOut(auth);
         setAlias("");
         setIrlFirstName("");
         setDecks([]);
         setElo(null);
         setPoints(null);
         setWins(null);
         setLosses(null);
         setStatsLoading(true);
         setOriginalAlias("");
         setOriginalIrlFirstName("");
         setOriginalDecks([]);
         setEmail("");
         setPassword("");
         setAuthError(null);
         setHasUnsavedChanges(false);
         setSaveCallback(null);
         setDiscardCallback(null);
      } catch (error) {
         console.error("Error signing out:", error);
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
               <div className="login-form">
                  <div className="email-auth-section">
                     <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                           id="email"
                           type="text"
                           value={email}
                           onChange={(e) => setEmail(e.target.value)}
                           placeholder="Enter your email"
                           autoFocus
                        />
                     </div>

                     <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                           id="password"
                           type="text"
                           value={password}
                           onChange={(e) => setPassword(e.target.value)}
                           placeholder="Enter your password"
                           onKeyDown={(e) => {
                              if (e.key === "Enter") handleEmailPasswordLogin();
                           }}
                        />
                     </div>

                     {authError && (
                        <div className="auth-error">{authError}</div>
                     )}

                     <button
                        className="email-login-btn"
                        onClick={handleEmailPasswordLogin}
                     >
                        Create or Login
                     </button>
                  </div>

                  <div className="auth-divider">
                     <span>OR</span>
                  </div>

                  <button
                     className="google-login-btn"
                     onClick={handleGoogleSignIn}
                  >
                     <svg viewBox="0 0 24 24" width="18" height="18">
                        <path
                           fill="#4285F4"
                           d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                           fill="#34A853"
                           d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                           fill="#FBBC05"
                           d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                           fill="#EA4335"
                           d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                     </svg>
                     Sign in with Google
                  </button>
               </div>
            </div>

            {showCreateAccountModal && pendingCredentials && (
               <CreateAccountModal
                  email={pendingCredentials.email}
                  password={pendingCredentials.password}
                  onCreateAccount={handleCreateAccount}
                  onCancel={handleCancelCreateAccount}
               />
            )}
         </div>
      );
   }

   return (
      <div className="page profile-page">
         <div className="profile-content">
            <div className="profile-header">
               <p className="profile-email">{user.email}</p>
               <button className="sign-out-btn" onClick={handleSignOut}>
                  Sign Out
               </button>
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

            <div className="profile-stats">
               {statsLoading ? (
                  <div className="stats-loading">
                     <div className="loading-spinner"></div>
                  </div>
               ) : (
                  <>
                     <div className="stat-item">
                        <label>PTS</label>
                        <span className="stat-value">{points}</span>
                     </div>
                     <div className="stat-item">
                        <label>Wins</label>
                        <span className="stat-value">{wins}</span>
                     </div>
                     <div className="stat-item">
                        <label>Losses</label>
                        <span className="stat-value">{losses}</span>
                     </div>
                     <div className="stat-item">
                        <label>ELO</label>
                        <span className="stat-value">{elo}</span>
                     </div>
                  </>
               )}
            </div>

            {currentPeriod && nextPeriod && matchCount && (
               <div className="matches-remaining-banner">
                  You have {matchCount.matchesRemaining} {matchCount.matchesRemaining === 1 ? 'match' : 'matches'} remaining until {formatPeriodTime(nextPeriod)}
               </div>
            )}

            <div className="decks-section">
               <h3>Your Decks</h3>
               <input
                  type="text"
                  className="deck-search"
                  placeholder="Search decks..."
                  value={deckSearch}
                  onChange={(e) => setDeckSearch(e.target.value)}
               />
               <div className="decks-list">
                  {filteredDecks.map((deck) => (
                     <DeckItem
                        key={deck.id}
                        deck={deck}
                        onDelete={deleteDeck}
                        onClick={setEditingDeck}
                     />
                  ))}
                  <button
                     className="add-deck-btn"
                     onClick={() => setIsAddDeckModalOpen(true)}
                  >
                     + Add Deck
                  </button>
               </div>
            </div>
         </div>

         {isAddDeckModalOpen && (
            <AddDeckModal
               onSave={addDeck}
               onDiscard={() => setIsAddDeckModalOpen(false)}
            />
         )}

         {editingDeck && (
            <EditDeckModal
               deck={editingDeck}
               onSave={updateDeck}
               onDiscard={() => setEditingDeck(null)}
            />
         )}
      </div>
   );
}

export default Profile;
