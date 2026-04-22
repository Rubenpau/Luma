import { signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { LogIn, LogOut, User as UserIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { UserProfile } from '../types';
import { saveUserProfile } from '../services/dbService';

interface NavbarProps {
  user: UserProfile | null;
}

export default function Navbar({ user }: NavbarProps) {
  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      await saveUserProfile({
        uid: user.uid,
        email: user.email!,
        displayName: user.displayName,
        photoURL: user.photoURL,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        // Gracefully ignore as this is a user action
        return;
      }
      console.error('Login failed:', error);
    }
  };

  const handleLogout = () => signOut(auth);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center p-4 md:p-6 pointer-events-none">
      <div className="glass-panel px-4 md:px-6 py-2.5 md:py-3 rounded-full flex items-center gap-4 md:gap-8 pointer-events-auto max-w-full overflow-hidden">
        <a href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brown-900 rounded-lg flex items-center justify-center text-beige-100 font-serif font-bold text-xl">L</div>
          <span className="font-serif font-bold text-lg hidden sm:block tracking-tight">Lumina</span>
        </a>

        <div className="h-4 w-[1px] bg-beige-300 hidden sm:block" />

        <div className="flex items-center gap-6">
          {!user ? (
            <button 
              onClick={handleLogin}
              className="flex items-center gap-2 text-sm font-semibold text-brown-900 hover:opacity-70 transition-opacity"
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </button>
          ) : (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || ''} className="w-7 h-7 rounded-full border border-beige-300" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-beige-300 flex items-center justify-center">
                    <UserIcon className="w-4 h-4 text-brown-900/40" />
                  </div>
                )}
                <span className="text-sm font-semibold text-brown-900 hidden md:block">{user.displayName || 'Creator'}</span>
              </div>
              <button 
                onClick={handleLogout}
                className="p-1.5 hover:bg-beige-200 rounded-full transition-colors text-brown-900/60"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
