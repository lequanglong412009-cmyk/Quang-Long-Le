import React, { useState, useEffect } from 'react';
import { Hero } from '../components/home/Hero';
import { DocumentCard } from '../components/home/DocumentCard';
import { getDocuments } from '../services/marketplaceService';
import { Document } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Layers, Sparkles, Users, Search, BookOpen, GraduationCap } from 'lucide-react';

const GRADES = ['Tất cả', 'Lớp 10', 'Lớp 11', 'Lớp 12'];
const SUBJECTS = ['Tất cả', 'Toán', 'Lí', 'Hóa', 'Sinh', 'Anh', 'Sử', 'Địa', 'Tin', 'Văn'];

export const Home: React.FC = () => {
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGrade, setSelectedGrade] = useState('Tất cả');
  const [selectedSubject, setSelectedSubject] = useState('Tất cả');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchDocs = async () => {
      setLoading(true);
      try {
        const allDocs = await getDocuments();
        let filtered = allDocs;

        if (selectedGrade !== 'Tất cả') {
          filtered = filtered.filter(d => d.category.startsWith(selectedGrade));
        }
        if (selectedSubject !== 'Tất cả') {
          filtered = filtered.filter(d => d.category.includes(selectedSubject));
        }
        
        if (searchQuery.trim()) {
          const queryTerms = searchQuery.toLowerCase().trim().split(/\s+/);
          filtered = filtered.filter(d => {
            const docTitle = d.title.toLowerCase();
            const docDesc = d.description.toLowerCase();
            const docCat = d.category.toLowerCase();
            
            // Check if ALL search terms are present in ANY of the fields
            return queryTerms.every(term => 
              docTitle.includes(term) || 
              docDesc.includes(term) || 
              docCat.includes(term)
            );
          });
        }

        setDocs(filtered);
      } catch (error) {
        console.error('Failed to fetch docs', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDocs();
  }, [selectedGrade, selectedSubject, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Hero onSearch={setSearchQuery} />

      {/* Filter Section */}
      <section className="sticky top-16 z-40 bg-white/60 backdrop-blur-2xl border-y border-slate-100 py-6 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest mr-2">
                <GraduationCap className="w-5 h-5 text-indigo-600" /> Khối lớp:
              </div>
              {GRADES.map(grade => (
                <button
                  key={grade}
                  onClick={() => setSelectedGrade(grade)}
                  className={`px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                    selectedGrade === grade 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 scale-105' 
                    : 'bg-white text-slate-400 border border-slate-200 hover:text-indigo-600 hover:border-indigo-600/30'
                  }`}
                >
                  {grade}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest mr-2">
                <BookOpen className="w-5 h-5 text-indigo-600" /> Môn trọng tâm:
              </div>
              <div className="flex flex-wrap gap-2">
                {SUBJECTS.map(sub => (
                  <button
                    key={sub}
                    onClick={() => setSelectedSubject(sub)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                      selectedSubject === sub
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-600 shadow-sm'
                      : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-indigo-600/20'
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="flex flex-col md:flex-row items-baseline justify-between mb-16 gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase tracking-[0.25em] mb-4">
              <Layers className="w-5 h-5" />{' '}
              {selectedGrade === 'Tất cả' && selectedSubject === 'Tất cả' 
                ? 'Tài liệu tuyển chọn' 
                : `Kết quả tìm kiến: ${selectedGrade} ${selectedSubject !== 'Tất cả' ? `> ${selectedSubject}` : ''}`}
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
              {loading ? 'Đang soạn thảo...' : docs.length > 0 ? 'Tài liệu dành cho học sinh' : 'Rất tiếc, không tìm thấy'}
            </h2>
          </div>
          <div className="flex items-center gap-3 text-slate-400 text-xs font-black uppercase tracking-widest bg-slate-100 px-4 py-2 rounded-full">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
            {docs.length} tài liệu sẵn sàng
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-[3/4] rounded-3xl bg-slate-200 animate-pulse" />
            ))}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {docs.length > 0 ? (
              <motion.div 
                key={`${selectedGrade}-${selectedSubject}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10"
              >
                {docs.map((doc, index) => (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <DocumentCard document={doc} />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <div className="py-24 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100 shadow-sm">
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8">
                  <Search className="w-10 h-10 text-slate-200" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">Không tìm thấy tài liệu phù hợp</h3>
                <p className="text-slate-400 text-sm max-w-sm mx-auto mb-10 font-medium">Bạn hãy thử thay đổi bộ lọc hoặc tìm kiếm theo từ khóa khác để có kết quả tốt hơn nhé.</p>
                <button 
                  onClick={() => { setSelectedGrade('Tất cả'); setSelectedSubject('Tất cả'); }}
                  className="px-10 py-4 bg-indigo-600 hover:bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/20 active:scale-95"
                >
                  Thiết lập lại bộ lọc
                </button>
              </div>
            )}
          </AnimatePresence>
        )}
      </section>

      {/* Features Showcase Section */}
      <section className="bg-white py-32 border-t border-slate-100 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="p-10 rounded-[2.5rem] bg-indigo-600 shadow-2xl shadow-indigo-600/30 text-white relative group hover:-translate-y-2 transition-all duration-500">
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mb-8 backdrop-blur-md">
                <Layers className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-black mb-4 tracking-tight">Kiến thức chuẩn 2026</h3>
              <p className="text-indigo-100 opacity-80 text-sm leading-relaxed font-medium">
                Từng tài liệu lọt vào thư viện đều được rà soát nội dung kỹ lưỡng, bám sát cấu trúc đề thi THPT Quốc gia mới nhất.
              </p>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl pointer-events-none" />
            </div>

            <div className="p-10 rounded-[2.5rem] bg-slate-50 border border-slate-100 text-slate-900 hover:border-indigo-600/30 transition-all duration-500">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mb-8">
                <Sparkles className="w-7 h-7 text-indigo-600" />
              </div>
              <h3 className="text-2xl font-black mb-4 tracking-tight">Hỗ trợ học sinh 24/7</h3>
              <p className="text-slate-500 text-sm leading-relaxed font-medium">
                Đội ngũ Admin luôn sẵn sàng giải đáp thắc mắc và hỗ trợ kỹ thuật để bạn có trải nghiệm học tập mượt mà nhất.
              </p>
            </div>

            <div className="p-10 rounded-[2.5rem] bg-slate-50 border border-slate-100 text-slate-900 hover:border-indigo-600/30 transition-all duration-500">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mb-8">
                <Users className="w-7 h-7 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-black mb-4 tracking-tight">Phần mềm & Tiện ích</h3>
              <p className="text-slate-500 text-sm leading-relaxed font-medium">
                Cung cấp các công cụ hỗ trợ tính toán, tra cứu ngữ pháp và ghi chú thông minh dành riêng cho học sinh THPT.
              </p>
            </div>
          </div>
        </div>
        {/* Background decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full bg-slate-50/50 -z-10" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-50 rounded-full blur-[100px] opacity-50" />
      </section>
    </div>
  );
};
