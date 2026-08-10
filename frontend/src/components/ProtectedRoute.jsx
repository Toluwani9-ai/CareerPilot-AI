import { Navigate, useLocation } from "react-router-dom";

// authentication token keys
const AUTH_TOKEN_KEYS = [
  "careerPilotAuthToken",
  "careerPilotToken",
  "authToken",
  "accessToken",
  "access_token",
  "token",
];

const AUTH_USER_KEYS = [
  "careerPilotUser",
  "currentUser",
  "user",
];

// Read a value from storage
function readStoredValue(storage, key) {
  try {
    const value = storage.getItem(key);

    if (!value) {
      return null;
    }

    const normalisedValue = value.trim().toLowerCase();

    if (
      normalisedValue === "null" ||
      normalisedValue === "undefined" ||
      normalisedValue === "false"
    ) {
      return null;
    }

    return value;
  } catch {
    return null;
  }
}

// Checks for stored authentication
function hasStoredAuthentication() {
  const storageLocations = [localStorage, sessionStorage];

  for (const storage of storageLocations) {
    const hasToken = AUTH_TOKEN_KEYS.some((key) =>
      Boolean(readStoredValue(storage, key)),
    );

    if (hasToken) {
      return true;
    }
    
    // Look for stored user data
    const hasUser = AUTH_USER_KEYS.some((key) => {
      const storedUser = readStoredValue(storage, key);

      if (!storedUser) {
        return false;
      }

      // Validate JSON user object
      try {
        const parsedUser = JSON.parse(storedUser);

        return Boolean(
          parsedUser &&
            typeof parsedUser === "object" &&
            (
              parsedUser.id ||
              parsedUser.email ||
              parsedUser.username ||
              parsedUser.isAuthenticated
            ),
        );
      } catch {
        return storedUser.length > 0;
      }
    });

    // Return if user data exists
    if (hasUser) {
      return true;
    }
  }

  return false;
}

function ProtectedRoute({ children }) {
  const location = useLocation();
  const isAuthenticated = hasStoredAuthentication();

  // Redirect unauthenticated users
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname,
          message: "Please sign in to access this page.",
        }}
      />
    );
  }

  return children;
}

export default ProtectedRoute;