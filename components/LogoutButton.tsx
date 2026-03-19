'use client';

import { LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';

export default function LogoutButton() {
  return (
    <button
      // signOut מוחק את ה-Token בשרת ומנתב אוטומטית לעמוד ההתחברות
      onClick={() => signOut({ callbackUrl: '/login' })}
      className="flex items-center gap-3 px-4 py-3 w-full text-start text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl transition-colors font-bold"
    >
      <LogOut size={20} />
      <span>התנתקות מהמערכת</span>
    </button>
  );
}
