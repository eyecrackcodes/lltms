import { db } from "./config";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";

export const migrateTrainingAssignments = async () => {
  try {
    console.log("Starting training assignments migration...");

    // Get all documents from old collection
    const oldCollectionRef = collection(db, "training_assignments");
    const snapshot = await getDocs(oldCollectionRef);

    // Migrate each document
    for (const doc of snapshot.docs) {
      const data = doc.data();

      // Create new document with updated field name
      await setDoc(doc(db, "trainingAssignments", doc.id), {
        ...data,
        userId: data.agentId, // Rename field
        // Remove old field
        agentId: undefined,
      });

      // Delete old document
      await deleteDoc(doc.ref);
    }

    console.log("Migration completed successfully");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
};
