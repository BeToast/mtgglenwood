import { useMemo, useState, useEffect } from "react";
import { type Period, formatPeriodTime } from "../utils/periodCalculator";
import { type MatchCount, getPlayerMatchCount } from "../utils/matchCounter";
import "./PeriodList.css";

interface PeriodListProps {
   periods: Period[];
   currentPeriodId: string | null;
   isAdmin: boolean;
   onEdit: (period: Period) => void;
   onDelete: (periodId: string) => void;
   userEmail?: string;
}

function PeriodList({
   periods,
   currentPeriodId,
   isAdmin,
   onEdit,
   onDelete,
   userEmail,
}: PeriodListProps) {
   const [currentUserMatchCount, setCurrentUserMatchCount] =
      useState<MatchCount | null>(null);

   const orderedPeriods = useMemo(() => {
      if (!currentPeriodId) return periods;

      const currentPeriod = periods.find((p) => p.id === currentPeriodId);
      const otherPeriods = periods.filter((p) => p.id !== currentPeriodId);

      return currentPeriod ? [currentPeriod, ...otherPeriods] : periods;
   }, [periods, currentPeriodId]);

   useEffect(() => {
      if (userEmail && currentPeriodId) {
         const currentPeriod = periods.find((p) => p.id === currentPeriodId);
         if (currentPeriod) {
            loadCurrentUserMatchCount(currentPeriod);
         }
      }
   }, [userEmail, currentPeriodId, periods]);

   const loadCurrentUserMatchCount = async (period: Period) => {
      if (!userEmail) return;

      try {
         const count = await getPlayerMatchCount(
            userEmail,
            period.id,
            period.matchesPerPlayer
         );
         setCurrentUserMatchCount(count);
      } catch (error) {
         console.error("Error loading current user match count:", error);
      }
   };

   if (periods.length === 0) {
      return (
         <div className="period-list-empty">
            <p>No periods configured yet.</p>
            {isAdmin && <p>Click the Create Period button to add one.</p>}
         </div>
      );
   }

   return (
      <div className="period-list">
         {orderedPeriods.map((period, index) => {
            const isCurrent = period.id === currentPeriodId;
            const nextPeriod = index + 1 < orderedPeriods.length
               ? orderedPeriods[index + 1]
               : orderedPeriods[0]; // Wrap around to first period

            return (
               <div
                  key={period.id}
                  className={`period-item ${isCurrent ? "current" : ""}`}
               >
                  <div className="period-info">
                     <div className="period-from-to">
                        <div>
                           <span className="time-label">From:</span>{" "}
                           <span className="time-value">
                              {formatPeriodTime(period)}
                           </span>
                        </div>
                        <div>
                           <span className="time-label">To:</span>{" "}
                           <span className="time-value">
                              {formatPeriodTime(nextPeriod)}
                           </span>
                        </div>
                     </div>
                     <div className="period-details">
                        <div className="period-limit">
                           Each player gets {period.matchesPerPlayer}{" "}
                           {period.matchesPerPlayer === 1 ? "match" : "matches"}
                        </div>
                        {isCurrent && currentUserMatchCount && (
                           <div className="period-remaining">
                              You have {currentUserMatchCount.matchesRemaining}{" "}
                              {currentUserMatchCount.matchesRemaining === 1
                                 ? "match"
                                 : "matches"}{" "}
                              remaining
                           </div>
                        )}
                     </div>
                  </div>
                  {isAdmin && (
                     <div className="period-actions">
                        <button
                           className="period-edit-btn"
                           onClick={() => onEdit(period)}
                        >
                           Edit
                        </button>
                        <button
                           className="period-delete-btn"
                           onClick={() => onDelete(period.id)}
                        >
                           Delete
                        </button>
                     </div>
                  )}
               </div>
            );
         })}
      </div>
   );
}

export default PeriodList;
