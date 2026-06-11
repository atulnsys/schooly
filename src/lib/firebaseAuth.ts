import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase Applet configuration
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Configure Google OAuth Provider with specified read-only Workspace scopes
const provider = new GoogleAuthProvider();
provider.addScope("https://www.googleapis.com/auth/drive.readonly");
provider.addScope("https://www.googleapis.com/auth/classroom.courses.readonly");
provider.addScope("https://www.googleapis.com/auth/classroom.coursework.students.readonly");
provider.addScope("https://www.googleapis.com/auth/classroom.announcements.readonly");

let isSigningIn = false;
let cachedAccessToken: string | null = null;

// Track auth states securely in-memory
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // Trigger login popup if token expired or is not cached under standard session parameters
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Initiate standard Google Auth popup interaction
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error("Failed to capture valid OAuth access token from authorization response.");
    }

    cachedAccessToken = credential.accessToken;
    // Persist accessToken in sessionStorage temporarily during session lifespan for smooth hot-reloads/tab changes
    try {
      sessionStorage.setItem("schooly_oauth_token", cachedAccessToken);
    } catch {
      // Ignored if sandbox prevents writing
    }
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error("[OAUTH EXPORT ERROR] googleSignIn failed:", error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

// Retrieve memory or session cached access tokens
export const getAccessToken = async (): Promise<string | null> => {
  if (!cachedAccessToken) {
    try {
      cachedAccessToken = sessionStorage.getItem("schooly_oauth_token");
    } catch {
      cachedAccessToken = null;
    }
  }
  return cachedAccessToken;
};

// End current faculty/user session
export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
  try {
    sessionStorage.removeItem("schooly_oauth_token");
    localStorage.removeItem("schooly_workspace_connected");
  } catch {
    // Ignored
  }
};
