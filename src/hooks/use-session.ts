
'use client';

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // أو استخدم next/navigation لو كنت Next.js

type AllowedRole = 'superadmin' | 'admin' | 'owner';

interface UseSessionOptions {
  allowedRoles: AllowedRole[];
  redirectTo: string; // وين يروح لو ماله صلاحية
}

export function useSession({ allowedRoles, redirectTo }: UseSessionOptions) {
  useEffect(() => {
    const sessionData = localStorage.getItem('session');

    if (!sessionData) {
      window.location.href = redirectTo;
      return;
    }

    const session = JSON.parse(sessionData);

    if (!allowedRoles.includes(session.role)) {
      window.location.href = redirectTo;
    }
  }, []);
}
