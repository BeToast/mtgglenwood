import { useState, useEffect, useMemo } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import LogMatchModal from "../components/LogMatchModal";
import {
   getAllPeriods,
   getCurrentPeriod,
} from "../utils/periodCalculator";
import { type MatchCount, getPlayerMatchCount } from "../utils/matchCounter";
import "./Matches.css";

interface Match {
   id: string;
   player1Email: string;
   player1FirstName: string;
   player1DeckName: string;
   player1DeckUrl?: string;
   player1Wins: number;
   player1EloChange: number;
   player2Email: string;
   player2FirstName: string;
   player2DeckName: string;
   player2DeckUrl?: string;
   player2Wins: number;
   player2EloChange: number;
   timeCreated: string;
}

function Matches() {
   const { user } = useAuth();
   const [matches, setMatches] = useState<Match[]>([]);
   const [search, setSearch] = useState("");
   const [loading, setLoading] = useState(true);
   const [isLogMatchModalOpen, setIsLogMatchModalOpen] = useState(false);
   const [copiedDeck, setCopiedDeck] = useState<string | null>(null);
   const [matchCount, setMatchCount] = useState<MatchCount | null>(null);

   useEffect(() => {
      loadMatches();
   }, []);

   useEffect(() => {
      if (user?.email) {
         loadMatchCount();
      }
   }, [user]);

   const loadMatches = async () => {
      try {
         const matchesCollection = collection(db, "matches");
         const q = query(matchesCollection, orderBy("timeCreated", "desc"));
         const querySnapshot = await getDocs(q);

         const matchesData: Match[] = [];
         querySnapshot.forEach((doc) => {
            const data = doc.data();
            matchesData.push({
               id: doc.id,
               player1Email: data.player1Email,
               player1FirstName: data.player1FirstName,
               player1DeckName: data.player1DeckName,
               player1DeckUrl: data.player1DeckUrl,
               player1Wins: data.player1Wins,
               player1EloChange: data.player1EloChange,
               player2Email: data.player2Email,
               player2FirstName: data.player2FirstName,
               player2DeckName: data.player2DeckName,
               player2DeckUrl: data.player2DeckUrl,
               player2Wins: data.player2Wins,
               player2EloChange: data.player2EloChange,
               timeCreated: data.timeCreated,
            });
         });

         setMatches(matchesData);
      } catch (error) {
         console.error("Error loading matches:", error);
      } finally {
         setLoading(false);
      }
   };

   const loadMatchCount = async () => {
      if (!user?.email) return;

      try {
         const periods = await getAllPeriods();
         if (periods.length === 0) return;

         const current = getCurrentPeriod(periods);

         if (current) {
            const count = await getPlayerMatchCount(
               user.email,
               current.id,
               current.matchesPerPlayer
            );
            setMatchCount(count);
         }
      } catch (error) {
         console.error("Error loading match count:", error);
      }
   };

   const filteredMatches = useMemo(() => {
      if (!search.trim()) return matches;

      const searchLower = search.toLowerCase();
      return matches.filter(
         (match) =>
            match.player1FirstName.toLowerCase().includes(searchLower) ||
            match.player2FirstName.toLowerCase().includes(searchLower) ||
            match.player1DeckName.toLowerCase().includes(searchLower) ||
            match.player2DeckName.toLowerCase().includes(searchLower)
      );
   }, [matches, search]);

   const handleMatchLogged = () => {
      setIsLogMatchModalOpen(false);
      loadMatches();
      loadMatchCount();
   };

   const handleDeckClick = async (
      deckUrl: string | undefined,
      deckId: string
   ) => {
      if (!deckUrl) return;

      try {
         await navigator.clipboard.writeText(deckUrl);
         setCopiedDeck(deckId);
         setTimeout(() => setCopiedDeck(null), 2000);
      } catch (err) {
         console.error("Failed to copy:", err);
      }
   };

   if (loading) {
      return (
         <div className="page matches-page">
            <div className="matches-loading">Loading matches...</div>
         </div>
      );
   }

   return (
      <div className="page">
         <div className="matches-page">
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
                     {search ? "No matches found" : "No matches yet"}
                  </div>
               ) : (
                  filteredMatches.map((match) => {
                     const isPlayer1Winner =
                        match.player1Wins > match.player2Wins;
                     const winner = isPlayer1Winner
                        ? {
                             name: match.player1FirstName,
                             deck: match.player1DeckName,
                             deckUrl: match.player1DeckUrl,
                          }
                        : {
                             name: match.player2FirstName,
                             deck: match.player2DeckName,
                             deckUrl: match.player2DeckUrl,
                          };
                     const loser = isPlayer1Winner
                        ? {
                             name: match.player2FirstName,
                             deck: match.player2DeckName,
                             deckUrl: match.player2DeckUrl,
                          }
                        : {
                             name: match.player1FirstName,
                             deck: match.player1DeckName,
                             deckUrl: match.player1DeckUrl,
                          };

                     const winnerWins = isPlayer1Winner
                        ? match.player1Wins
                        : match.player2Wins;
                     const loserWins = isPlayer1Winner
                        ? match.player2Wins
                        : match.player1Wins;

                     const winnerDeckId = `${match.id}-winner`;
                     const loserDeckId = `${match.id}-loser`;

                     return (
                        <div key={match.id} className="match-item">
                           <div className="match-result winner">
                              <div className="match-wins">
                                 {Array.from({ length: winnerWins }).map(
                                    (_, i) => (
                                       <span key={i} className="win-check">
                                          ✓
                                       </span>
                                    )
                                 )}
                              </div>
                              <span className="points-indicator">+3pts</span>
                              <span className="player-name">{winner.name}</span>
                              <span
                                 className={`deck-name ${
                                    copiedDeck === winnerDeckId ? "copied" : ""
                                 }`}
                                 onClick={() =>
                                    handleDeckClick(
                                       winner.deckUrl,
                                       winnerDeckId
                                    )
                                 }
                              >
                                 {copiedDeck === winnerDeckId
                                    ? "deck url copied"
                                    : winner.deck}
                              </span>
                           </div>
                           <div className="match-result loser">
                              <div className="match-wins">
                                 {Array.from({ length: loserWins }).map(
                                    (_, i) => (
                                       <span key={i} className="win-check">
                                          ✓
                                       </span>
                                    )
                                 )}
                              </div>
                              <span className="points-indicator">+1pt</span>
                              <span className="player-name">{loser.name}</span>
                              <span
                                 className={`deck-name ${
                                    copiedDeck === loserDeckId ? "copied" : ""
                                 }`}
                                 onClick={() =>
                                    handleDeckClick(loser.deckUrl, loserDeckId)
                                 }
                              >
                                 {copiedDeck === loserDeckId
                                    ? "deck url copied"
                                    : loser.deck}
                              </span>
                           </div>
                        </div>
                     );
                  })
               )}
            </div>
         </div>

         {user ? (
            <button
               className="log-match-btn"
               onClick={() => setIsLogMatchModalOpen(true)}
               disabled={matchCount?.matchesRemaining === 0}
            >
               {matchCount ? (
                  matchCount.matchesLogged >= matchCount.periodLimit ? (
                     `You logged ${matchCount.matchesLogged}/${matchCount.periodLimit} matches this period`
                  ) : (
                     `Log Match (${matchCount.matchesLogged + 1}/${matchCount.periodLimit})`
                  )
               ) : (
                  "Log Match"
               )}
            </button>
         ) : null}

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
