import { useState, useEffect } from "react";

const STORAGE_KEY = "hasLoggedInBefore";

export const useFirstTimeUser = () => {
  const [hasLoggedInBefore, setHasLoggedInBefore] = useState(false);

  useEffect(() => {
    const storedValue = localStorage.getItem(STORAGE_KEY);
    setHasLoggedInBefore(!!storedValue);
  }, []);

  const markAsLoggedIn = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setHasLoggedInBefore(true);
  };

  return {
    hasLoggedInBefore,
    markAsLoggedIn,
  };
};
