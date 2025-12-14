import {
  GoogleAuthProvider,
  signInWithPopup,
  setPersistence,
  browserSessionPersistence,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { firebaseAuth } from "./config";

/**
 * Return type for the auth functions
 */
export type SignInReturn =
  | {
      success: true;
      user: User;
      error: null;
    }
  | {
      success: false;
      user: null;
      error: unknown;
    };

/**
 * Google authentication provider
 */
const googleProvider = new GoogleAuthProvider();

/**
 * Sign the user in with a Google popup authentication.
 * @returns User details if successful, else, caught error.
 */
export const signInWithGoogle = async (): Promise<SignInReturn> => {
  try {
    return setPersistence(firebaseAuth, browserSessionPersistence).then(
      async () => {
        const result = await signInWithPopup(firebaseAuth, googleProvider);
        return {
          success: true,
          user: result.user,
          error: null,
        };
      }
    );
  } catch (error) {
    return {
      success: false,
      user: null,
      error,
    };
  }
};

/**
 * Sign the user in with a credential authentication.
 * @returns User details if successful, else, caught error.
 */
export async function signInWithCredentials(
  email: string,
  password: string
): Promise<SignInReturn> {
  try {
    return setPersistence(firebaseAuth, browserSessionPersistence).then(
      async () => {
        const userCredential = await signInWithEmailAndPassword(
          firebaseAuth,
          email,
          password
        );
        return {
          success: true,
          user: userCredential.user,
          error: null,
        };
      }
    );
  } catch (error) {
    return {
      success: false,
      user: null,
      error,
    };
  }
}

/**
 * Signout of current accounts
 * @returns True if successful, false with error message otherwise
 */
export const firebaseSignOut = async () => {
  try {
    await signOut(firebaseAuth);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error,
    };
  }
};
