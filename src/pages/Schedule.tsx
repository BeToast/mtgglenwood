import { useState, useEffect } from "react";
import {
   collection,
   addDoc,
   updateDoc,
   deleteDoc,
   doc,
   getDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import {
   type Period,
   getAllPeriods,
   getCurrentPeriod,
} from "../utils/periodCalculator";
import PeriodList from "../components/PeriodList";
import PeriodFormModal from "../components/PeriodFormModal";
import "./Schedule.css";

function Schedule() {
   const { user } = useAuth();
   const [periods, setPeriods] = useState<Period[]>([]);
   const [currentPeriod, setCurrentPeriod] = useState<Period | null>(null);
   const [isAdmin, setIsAdmin] = useState(false);
   const [showCreateModal, setShowCreateModal] = useState(false);
   const [editingPeriod, setEditingPeriod] = useState<Period | null>(null);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      if (user) {
         checkAdminStatus();
         loadPeriods();
      }
   }, [user]);

   const checkAdminStatus = async () => {
      if (!user) return;

      try {
         const docRef = doc(db, "users", user.uid);
         const docSnap = await getDoc(docRef);
         if (docSnap.exists()) {
            setIsAdmin(docSnap.data()?.admin === true);
         }
      } catch (error) {
         console.error("Error checking admin status:", error);
      }
   };

   const loadPeriods = async () => {
      setLoading(true);
      try {
         const fetchedPeriods = await getAllPeriods();
         setPeriods(fetchedPeriods);

         if (fetchedPeriods.length > 0) {
            const current = getCurrentPeriod(fetchedPeriods);
            setCurrentPeriod(current);
         }
      } catch (error) {
         console.error("Error loading periods:", error);
      } finally {
         setLoading(false);
      }
   };

   const handleCreatePeriod = async (
      periodData: Omit<Period, "id" | "createdAt" | "updatedAt">
   ) => {
      try {
         const now = new Date().toISOString();
         await addDoc(collection(db, "periods"), {
            ...periodData,
            createdAt: now,
            updatedAt: now,
         });

         setShowCreateModal(false);
         await loadPeriods();
      } catch (error) {
         console.error("Error creating period:", error);
         alert("Failed to create period. Please try again.");
      }
   };

   const handleUpdatePeriod = async (
      periodData: Omit<Period, "id" | "createdAt" | "updatedAt">
   ) => {
      if (!editingPeriod) return;

      try {
         const periodRef = doc(db, "periods", editingPeriod.id);
         await updateDoc(periodRef, {
            ...periodData,
            updatedAt: new Date().toISOString(),
         });

         setEditingPeriod(null);
         await loadPeriods();
      } catch (error) {
         console.error("Error updating period:", error);
         alert("Failed to update period. Please try again.");
      }
   };

   const handleDeletePeriod = async (periodId: string) => {
      const confirmed = window.confirm(
         "Are you sure you want to delete this period? Matches associated with this period will not be deleted, but the period reference will be removed."
      );

      if (!confirmed) return;

      try {
         await deleteDoc(doc(db, "periods", periodId));
         await loadPeriods();
      } catch (error) {
         console.error("Error deleting period:", error);
         alert("Failed to delete period. Please try again.");
      }
   };

   if (loading) {
      return (
         <div className="page schedule-page">
            <h1>Game Periods</h1>
            <p>Loading...</p>
         </div>
      );
   }

   return (
      <div className="page schedule-page">
         <div className="schedule-header">
            <h1>Match Periods</h1>
         </div>

         <div className="periods-section">
            <PeriodList
               periods={periods}
               currentPeriodId={currentPeriod?.id || null}
               isAdmin={isAdmin}
               onEdit={setEditingPeriod}
               onDelete={handleDeletePeriod}
               userEmail={user?.email || undefined}
            />
         </div>

         {isAdmin && (
            <button
               className="create-period-btn"
               onClick={() => setShowCreateModal(true)}
            >
               + Create Period
            </button>
         )}

         {showCreateModal && (
            <PeriodFormModal
               period={null}
               onSave={handleCreatePeriod}
               onCancel={() => setShowCreateModal(false)}
            />
         )}

         {editingPeriod && (
            <PeriodFormModal
               period={editingPeriod}
               onSave={handleUpdatePeriod}
               onCancel={() => setEditingPeriod(null)}
            />
         )}
      </div>
   );
}

export default Schedule;
