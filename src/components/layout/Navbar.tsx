import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, LogOut, Users } from 'lucide-react';
import { auth } from '../../lib/firebase';
import { onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getProfile, createProfile } from '../../services/marketplaceService';
import { UserProfile } from '../../types';

export const Navbar: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const profile = await getProfile(firebaseUser.uid);
        if (profile) {
          setUser(profile);
        } else {
          const newProfile = await createProfile(
            firebaseUser.uid, 
            firebaseUser.email!, 
            firebaseUser.displayName || 'User'
          );
          setUser(newProfile);
        }
      } else {
        setUser(null);
      }
    });
  }, []);

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Login failed', error);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-[60] py-4 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto h-20 px-6 rounded-[1.5rem] bg-white/70 backdrop-blur-xl border border-white shadow-[0_8px_32px_rgba(0,0,0,0.04)] flex items-center justify-between transition-all duration-500">
        <Link to="/" className="flex items-center gap-3 active:scale-95 transition-transform group">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 group-hover:rotate-6 transition-transform">
            <BookOpen className="w-6 h-6" />
          </div>
          <span className="text-xl font-black text-slate-900 tracking-tighter hidden sm:block">
            Tài liệu <span className="text-indigo-600">hay</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          <Link to="/" className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900 hover:text-indigo-600 transition-colors">Trang chủ</Link>
          <Link to="/profile?tab=purchased" className="text-[11px] font-black uppercase tracking-[0.2em] text-[#6B7280] hover:text-indigo-600 transition-colors">Tài liệu của tôi</Link>
          {user?.email === 'tailieuhay53@gmail.com' && (
            <Link to="/admin" className="flex items-center gap-2 group">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-600 group-hover:text-emerald-500 transition-colors">Admin Dashboard</span>
            </Link>
          )}
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              <Link to="/profile" className="flex items-center gap-3 p-1.5 pr-4 rounded-full bg-slate-50 border border-slate-100 hover:bg-white hover:border-indigo-100 transition-all group shadow-sm hover:shadow-md">
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-black text-white group-hover:scale-105 transition-transform">
                  {user.displayName?.charAt(0) || user.email?.charAt(0)}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest leading-none mb-0.5">{user.displayName || 'Học sinh'}</p>
                  <p className="text-[9px] text-[#6B7280] font-bold truncate max-w-[80px]">{user.email}</p>
                </div>
              </Link>
              <button 
                onClick={handleLogout}
                className="w-11 h-11 rounded-2xl bg-slate-50 text-[#6B7280] hover:text-red-500 hover:bg-red-50 border border-slate-100 hover:border-red-100 transition-all flex items-center justify-center active:scale-90 shadow-sm"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <button 
              onClick={handleLogin}
              className="px-8 py-3 bg-indigo-600 hover:bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/30 flex items-center gap-3 active:scale-95"
            >
              <Users className="w-4 h-4" />
              Đăng nhập
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};
