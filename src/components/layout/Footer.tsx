import React from 'react';
import { BookOpen, Facebook, Twitter, Instagram, Mail, Phone } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="footer-details bg-white text-slate-900 pb-12 border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-600/20">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-black tracking-tight">Tài liệu <span className="text-indigo-600">hay</span></span>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed font-medium">
              Nền tảng chia sẻ tài liệu THPT hàng đầu. Đồng hành cùng học sinh chinh phục kỳ thi THPT Quốc gia với kho tri thức chất lượng nhất.
            </p>
          </div>

          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 mb-8">Môn học trọng tâm</h3>
            <ul className="space-y-4 text-slate-500 text-sm font-bold">
              <li><a href="#" className="hover:text-indigo-600 transition-colors uppercase tracking-widest text-[11px]">Toán học THPT</a></li>
              <li><a href="#" className="hover:text-indigo-600 transition-colors uppercase tracking-widest text-[11px]">Ngữ Văn lớp 12</a></li>
              <li><a href="#" className="hover:text-indigo-600 transition-colors uppercase tracking-widest text-[11px]">Tiếng Anh ôn thi</a></li>
              <li><a href="#" className="hover:text-indigo-600 transition-colors uppercase tracking-widest text-[11px]">Vật lý - Hóa học</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 mb-8">Hỗ trợ học sinh</h3>
            <ul className="space-y-4 text-slate-500 text-sm font-bold">
              <li><a href="#" className="hover:text-indigo-600 transition-colors uppercase tracking-widest text-[11px]">Cách tải tài liệu</a></li>
              <li><a href="#" className="hover:text-indigo-600 transition-colors uppercase tracking-widest text-[11px]">Chính sách giá cả</a></li>
              <li><a href="#" className="hover:text-indigo-600 transition-colors uppercase tracking-widest text-[11px]">Điều khoản học tập</a></li>
              <li><a href="#" className="hover:text-indigo-600 transition-colors uppercase tracking-widest text-[11px]">Hỏi đáp tài liệu</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 mb-8">Liên hệ Admin</h3>
            <div className="space-y-5 text-slate-600 text-sm font-black">
              <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100 shadow-sm">
                <Phone className="w-5 h-5 text-indigo-600" /> <span>0386281920</span>
              </div>
              <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100 shadow-sm">
                <Mail className="w-5 h-5 text-indigo-600" /> <span>tailieuhay53@gmail.com</span>
              </div>
              <div className="flex gap-4 pt-4">
                <Facebook className="w-6 h-6 text-slate-400 hover:text-indigo-600 cursor-pointer transition-all" />
                <Twitter className="w-6 h-6 text-slate-400 hover:text-indigo-600 cursor-pointer transition-all" />
                <Instagram className="w-6 h-6 text-slate-400 hover:text-indigo-600 cursor-pointer transition-all" />
              </div>
            </div>
          </div>
        </div>
        <div className="mt-16 pt-8 border-t border-slate-100 text-center text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">
          © 2026 Tài liệu hay Marketplace. Phát triển vì thế hệ THPT.
        </div>
      </div>
    </footer>
  );
};
