import { useState, useEffect, useCallback } from 'react';

interface ImpersonatedUser {
  profileId: string;
  userId: string;
  email: string;
  fullName: string | null;
}

const STORAGE_KEY = 'admin_impersonation';

export function useImpersonation() {
  const [impersonatedUser, setImpersonatedUser] = useState<ImpersonatedUser | null>(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const startImpersonation = useCallback((user: ImpersonatedUser) => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    setImpersonatedUser(user);
  }, []);

  const stopImpersonation = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    setImpersonatedUser(null);
  }, []);

  const isImpersonating = !!impersonatedUser;

  return {
    impersonatedUser,
    isImpersonating,
    startImpersonation,
    stopImpersonation,
  };
}
