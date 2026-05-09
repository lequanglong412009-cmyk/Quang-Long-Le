import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, Sparkles, TrendingUp, BookOpen, Eye } from 'lucide-react';
import { getGlobalStats, trackSiteVisit } from '../../services/marketplaceService';

interface HeroProps {
  onSearch: (query: string) => void;
}

export const Hero: React.FC<HeroProps> = ({ onSearch }) => {
  const [stats, setStats] = useState({ totalSales: 0, totalViews: 0 });
  const [localQuery, setLocalQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(localQuery);
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        await trackSiteVisit();
        const data = await getGlobalStats();
        setStats({
          totalSales: data.totalSales,
          totalViews: data.totalViews
        });
      } catch (error) {
        console.error(error);
      }
    };
    fetchStats();
  }, []);

  return (
    <section className="relative pt-32 pb-28 overflow-hidden bg-white">
      {/* Dynamic Atmosphere Background - Light Mode Optimized */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[140%] h-[140%] -z-10 overflow-hidden">
        <div className="absolute top-[5%] left-[20%] w-[45%] h-[45%] bg-indigo-600/5 rounded-full blur-[140px] animate-pulse" />
        <div className="absolute bottom-[10%] right-[10%] w-[55%] h-[55%] bg-purple-600/5 rounded-full blur-[160px] animate-pulse delay-1000" />
        <div className="atmosphere absolute inset-0 opacity-40" />
      </div>

      {/* Decorative Floating Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
        <motion.div 
          animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-[10%] w-24 h-24 bg-indigo-50/40 backdrop-blur-3xl rounded-3xl border border-indigo-100 hidden xl:flex items-center justify-center -rotate-6 shadow-xl"
        >
          <BookOpen className="w-10 h-10 text-indigo-600/30" />
        </motion.div>
        <motion.div 
          animate={{ y: [0, 25, 0], rotate: [0, -8, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-1/3 right-[12%] w-32 h-32 bg-purple-50/40 backdrop-blur-3xl rounded-[2.5rem] border border-purple-100 hidden xl:flex items-center justify-center rotate-12 shadow-xl"
        >
          <Sparkles className="w-12 h-12 text-purple-600/30" />
        </motion.div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10"
        >
          <div className="inline-block relative">
            <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-[10px] font-black uppercase tracking-[0.25em] mb-10 hover:bg-indigo-100 transition-all cursor-default shadow-sm relative z-10">
              <Sparkles className="w-3.5 h-3.5 animate-spin-slow text-indigo-500" /> Ôn thi THPT Quốc gia 2026
            </span>
          </div>
          
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tight text-slate-900 mb-10 leading-[0.9] lg:leading-[0.85]">
            Kiến thức <br />
            <span className="relative inline-block mt-4">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 bg-[length:200%_auto] animate-shimmer">
                THPT Tuyển chọn
              </span>
              <div className="absolute -bottom-4 left-0 w-full h-2 bg-indigo-600/10 rounded-full blur-md" />
            </span>
          </h1>
          
          <p className="max-w-3xl mx-auto text-xl md:text-2xl text-slate-500 mb-16 leading-relaxed font-medium">
            Thư viện tài liệu học tập, đề thi thử và bí quyết đạt điểm tuyệt đối dành riêng cho <span className="text-indigo-600 font-black">Học sinh lớp 10, 11 & 12</span>.
          </p>
        </motion.div>

        <motion.form 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          onSubmit={handleSearchSubmit}
          className="max-w-3xl mx-auto relative group mb-28"
        >
          <div className="absolute -inset-4 bg-indigo-600/5 rounded-[3rem] blur-3xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-700" />
          <div className="relative">
            <Search className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-400 w-7 h-7 pointer-events-none group-focus-within:text-indigo-600 transition-colors" />
            <input 
              type="text" 
              placeholder="Tìm kiếm: Toán lớp 12, Đề thi thử, Văn mẫu, Tiếng Anh THPT..." 
              value={localQuery}
              onChange={(e) => {
                setLocalQuery(e.target.value);
                // Optional: real-time search
                onSearch(e.target.value);
              }}
              className="w-full pl-16 pr-44 py-7 bg-white border border-slate-200 rounded-[2.5rem] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-600/30 transition-all shadow-xl group-hover:border-slate-300 text-lg"
            />
            <button 
              type="submit"
              className="absolute right-3.5 top-3.5 bottom-3.5 px-10 bg-indigo-600 hover:bg-slate-900 text-white rounded-[1.5rem] transition-all active:scale-95 text-[11px] font-black uppercase tracking-widest shadow-xl shadow-indigo-600/30 overflow-hidden group/btn"
            >
              <span className="relative z-10 flex items-center gap-2">
                Tìm tài liệu <Search className="w-4 h-4" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
            </button>
          </div>
        </motion.form>

        {/* Dynamic & Luxurious Stats Bar - Light Edition */}
        <motion.div 
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-wrap items-center justify-center gap-10 md:gap-32 py-12 px-10 md:px-20 bg-white/60 backdrop-blur-3xl rounded-[4rem] border border-slate-200 max-w-4xl mx-auto relative group shadow-[0_20px_50px_rgba(0,0,0,0.05)] overflow-hidden"
        >
          {/* Sales / Downloads */}
          <div className="flex items-center gap-6 group/stat cursor-default relative z-10">
            <div className="w-16 h-16 rounded-[1.25rem] bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover/stat:bg-indigo-600 group-hover/stat:text-white group-hover/stat:scale-110 group-hover/stat:-rotate-6 transition-all duration-500 shadow-sm shadow-indigo-600/10">
              <TrendingUp className="w-8 h-8" />
            </div>
            <div className="text-left">
              <span className="block text-4xl font-black text-slate-900 leading-none tracking-tight group-hover/stat:text-indigo-600 transition-colors">
                {stats.totalSales.toLocaleString()}
              </span>
              <span className="text-[10px] uppercase font-black tracking-[0.25em] text-slate-400 mt-2.5 block">Lượt tải</span>
            </div>
          </div>

          <div className="w-px h-16 bg-slate-200 hidden lg:block" />

          {/* Views */}
          <div className="flex items-center gap-6 group/stat cursor-default relative z-10">
            <div className="w-16 h-16 rounded-[1.25rem] bg-blue-50 flex items-center justify-center text-blue-600 group-hover/stat:bg-blue-600 group-hover/stat:text-white group-hover/stat:scale-110 group-hover/stat:rotate-6 transition-all duration-500 shadow-sm shadow-blue-600/10">
              <Eye className="w-8 h-8" />
            </div>
            <div className="text-left">
              <span className="block text-4xl font-black text-slate-900 leading-none tracking-tight group-hover/stat:text-blue-600 transition-colors">
                {stats.totalViews.toLocaleString()}
              </span>
              <span className="text-[10px] uppercase font-black tracking-[0.25em] text-slate-400 mt-2.5 block">Truy cập</span>
            </div>
          </div>
          
          {/* Decorative gradients inside stats bar */}
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-50/10 to-transparent pointer-events-none" />
        </motion.div>
      </div>
    </section>
  );
};
