import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  User as FirebaseUser,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db, handleFirestoreError, OperationType } from "./firebase";

export interface DBUserProfile {
  username: string;
  email: string;
  account_created: any; // Firestore Timestamp
  global_highscore: number;
  total_matches_played: number;
  total_wins: number;
}

/**
 * Signs in the user via standard Google Auth Popup and initializes their Firestore dashboard statistics
 */
export async function signInWithGoogle(): Promise<FirebaseUser> {
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: "select_account",
    });
    
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;

    // Check if player profile already exists in Firestore under users/{userId}
    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
      const username = user.displayName || user.email?.split("@")[0] || "NeoBlocker";
      const initialProfile: DBUserProfile = {
        username: username,
        email: user.email || "",
        account_created: serverTimestamp(),
        global_highscore: 0,
        total_matches_played: 0,
        total_wins: 0,
      };

      try {
        await setDoc(userRef, initialProfile);
      } catch (saveError) {
        handleFirestoreError(saveError, OperationType.CREATE, `users/${user.uid}`);
      }
    }

    return user;
  } catch (error) {
    console.error("Google login/registration error: ", error);
    throw error;
  }
}

/**
 * Signs out the current authenticated user session
 */
export async function logOutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("LogOut error: ", error);
    throw error;
  }
}

/**
 * Fetches a user's global statistics and metadata from the 'users' collection
 */
export async function fetchPlayerProfile(uid: string): Promise<DBUserProfile | null> {
  const userRef = doc(db, "users", uid);
  try {
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data() as DBUserProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${uid}`);
  }
}

/**
 * Updates a player's matches count, win count, and new personal best score
 * Triggered at the end of a single-player or multiplayer puzzle game.
 */
export async function savePlayerMatchStats(
  score: number,
  isWin: boolean
): Promise<DBUserProfile | null> {
  const user = auth.currentUser;
  if (!user) {
    console.warn("No active, logged-in user in Firebase, skipping remote stats save.");
    return null;
  }

  const userRef = doc(db, "users", user.uid);
  try {
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data() as DBUserProfile;
      const currentHigh = data.global_highscore || 0;
      const nextHigh = Math.max(currentHigh, score);
      const isNewHighScore = score > currentHigh;

      const updateData = {
        global_highscore: nextHigh,
        total_matches_played: (data.total_matches_played || 0) + 1,
        total_wins: (data.total_wins || 0) + (isWin ? 1 : 0),
      };

      await updateDoc(userRef, updateData);
      
      return {
        ...data,
        ...updateData,
      };
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
  }
}
