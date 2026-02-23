import { createContext, useContext } from "react";

// Provides the authenticated user's DB record (id, email, role, isActive, etc.)
// to all components inside DashboardLayout.
export const CurrentUserContext = createContext(null);

export const useCurrentUser = () => useContext(CurrentUserContext);
