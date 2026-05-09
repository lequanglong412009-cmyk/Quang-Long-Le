import React, { useState, useEffect } from 'react';
import { auth } from '../lib/firebase';
import { getProfile, getDocuments } from '../services/marketplaceService';
import { UserProfile, Document } from '../types';
import { DocumentCard } from '../components/home/DocumentCard';
import { User, Package, ShieldCheck, Loader2 } from 'lucide-react';

export const Profile: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [purchasedDocs, setPurchasedDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const user = auth.currentUser;
      if (user) {
        const data = await getProfile(user.uid);
        if (data) {
          setProfile(data);
          const allDocs = await getDocuments();
          const purchased = allDocs.filter(d => data.purchasedDocs.includes(d.id));
          setPurchasedDocs(purchased);
        }
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F7FF] pt-32 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#F5F7FF] pt-32 text-center">
        <h2 className="text-slate-900 text-2xl font-black">Vui lòng đăng nhập để xem hồ sơ</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7FF] pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Sidebar Info */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-gradient-to-b from-white to-[#f7f8ff] p-10 rounded-[3rem] text-center shadow-[0_10px_30px_rgba(0,0,0,0.04)] border border-white relative overflow-hidden group">
              <div className="w-24 h-24 rounded-[2rem] bg-indigo-50 border-2 border-white flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-600/5 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                <User className="w-12 h-12 text-indigo-600" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">{profile.displayName}</h2>
              <p className="text-[#6B7280] font-bold text-sm">{profile.email}</p>
            </div>

            {profile.email === 'tailieuhay53@gmail.com' && (
              <div className="p-8 rounded-[2.5rem] bg-[#f3f4ff] border border-[#dfe3ff] flex items-center gap-5 group hover:shadow-xl hover:shadow-indigo-600/5 transition-all">
                <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-indigo-600 shadow-sm group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <div className="text-sm">
                  <div className="font-black text-slate-900 uppercase tracking-widest text-xs mb-1">Quản trị viên</div>
                  <div className="text-[#6B7280] font-medium">Bạn có quyền truy cập hệ thống admin.</div>
                </div>
              </div>
            )}
          </div>

          {/* Purchased Documents */}
          <div className="lg:col-span-8">
            <div className="flex items-center gap-4 mb-10">
              <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-slate-100">
                <Package className="w-6 h-6 text-indigo-600" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Tài liệu đã mua</h2>
            </div>

            {purchasedDocs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {purchasedDocs.map(doc => (
                  <DocumentCard key={doc.id} document={doc} />
                ))}
              </div>
            ) : (
              <div className="glass p-20 rounded-[3rem] text-center border-2 border-dashed border-slate-200">
                <div className="bg-slate-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
                  <Package className="w-10 h-10 text-slate-200" />
                </div>
                <h3 className="text-slate-900 font-black text-2xl mb-4 tracking-tight">Chưa có tài liệu nào</h3>
                <p className="text-[#6B7280] text-sm max-w-sm mx-auto font-medium leading-relaxed">
                  Bạn chưa sở hữu tài liệu nào. Hãy khám phá kho tài liệu và thực hiện thanh toán để bắt đầu học tập.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
