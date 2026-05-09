import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Download, Share2, ShieldCheck, 
  ArrowLeft, Loader2, Sparkles, 
  CheckCircle2, CreditCard, Clock, AlertCircle, Copy,
  ExternalLink, Eye, BookOpen
} from 'lucide-react';
import { 
  getDocumentById, getSecureFileUrl,
  submitAccessRequest, trackDownload,
  getDocuments, MARKEPLTACE_COLLECTIONS
} from '../services/marketplaceService';
import { Document } from '../types';
import { auth, db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { motion } from 'motion/react';
import { DocumentCard } from '../components/home/DocumentCard';

export const DocumentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [documentData, setDocumentData] = useState<Document | null>(null);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [requestStatus, setRequestStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [processingRequest, setProcessingRequest] = useState(false);
  const [relatedDocs, setRelatedDocs] = useState<Document[]>([]);

  useEffect(() => {
    const init = async () => {
      if (!id) return;
      try {
        const data = await getDocumentById(id);
        if (data) {
          setDocumentData(data);
          
          // Fetch related documents
          const allDocs = await getDocuments();
          const related = allDocs
            .filter(d => d.id !== id && d.category === data.category)
            .slice(0, 4);
          setRelatedDocs(related);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [id]);

  useEffect(() => {
    if (!id || !auth.currentUser) {
      setHasPurchased(false);
      setRequestStatus(null);
      return;
    }

    const userId = auth.currentUser.uid;
    const purchaseRef = doc(db, MARKEPLTACE_COLLECTIONS.PURCHASES, `${userId}_${id}`);
    const requestRef = doc(db, MARKEPLTACE_COLLECTIONS.REQUESTS, `${userId}_${id}`);

    // Listen for purchases
    const unsubPurchase = onSnapshot(purchaseRef, (snap) => {
      setHasPurchased(snap.exists());
    });

    // Listen for requests
    const unsubRequest = onSnapshot(requestRef, (snap) => {
      if (snap.exists()) {
        setRequestStatus(snap.data().status);
      } else {
        setRequestStatus(null);
      }
    });

    return () => {
      unsubPurchase();
      unsubRequest();
    };
  }, [id, auth.currentUser?.uid]);

  const handlePurchase = async () => {
    if (!auth.currentUser) {
      alert('Vui lòng đăng nhập để thực hiện yêu cầu mua tài liệu!');
      return;
    }
    if (!documentData) return;

    setProcessingRequest(true);
    try {
      console.log('DocumentDetail: Submitting access request for document:', documentData.id);
      // Open form immediately for better reliability (triggered by user interaction)
      const formUrl = `https://docs.google.com/forms/d/e/1FAIpQLSeu4HsdHzBD_9dWKcvEoPYW6aN8lcNC07OL9GfNPSkdyxmqEw/viewform?usp=sf_link`;
      window.open(formUrl, '_blank');

      await submitAccessRequest(documentData);
      console.log('DocumentDetail: Submit success!');
      setRequestStatus('pending');
      alert('Đã gửi lại yêu cầu! Vui lòng điền Form và chờ Admin kiểm tra.');
    } catch (error) {
      console.error('DocumentDetail: Submit error:', error);
      alert('Có lỗi xảy ra: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setProcessingRequest(false);
    }
  };

  const handleShare = async () => {
    if (!documentData) return;
    const shareData = {
      title: documentData.title,
      text: documentData.description,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('Đã sao chép liên kết vào bộ nhớ tạm!');
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Error sharing:', error);
      }
    }
  };

  const handleDownload = async () => {
    if (!id || !hasPurchased) return;
    setDownloading(true);
    try {
      const url = await getSecureFileUrl(id);
      if (url) {
        await trackDownload(id);
        window.open(url, '_blank');
      }
    } catch (error) {
      alert('Lỗi khi tải file: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F7FF] pt-32 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!documentData) {
    return (
      <div className="min-h-screen bg-[#F5F7FF] pt-32 text-center">
        <h2 className="text-slate-900 text-2xl font-black uppercase tracking-widest">Không tìm thấy tài liệu</h2>
        <button onClick={() => navigate('/')} className="mt-6 px-8 py-3 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-widest text-[11px] shadow-xl shadow-indigo-600/20 active:scale-95 transition-all">Quay lại trang chủ</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7FF] pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[#6B7280] hover:text-indigo-600 mb-8 transition-colors group font-black uppercase tracking-[0.2em] text-[10px]"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Quay lại
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-8 space-y-8">
            <div className="relative group">
              <div className="aspect-[3/4] rounded-[2.5rem] bg-white border border-slate-200 overflow-hidden relative shadow-2xl flex flex-col items-center justify-center p-8 text-center transition-all duration-500 group-hover:border-indigo-600/30">
                {/* Atmospheric Background - Blurred version of the actual thumbnail */}
                <div className="absolute inset-0 z-0">
                  <img 
                    src={documentData.thumbnailUrl} 
                    alt="" 
                    className="w-full h-full object-cover blur-3xl opacity-20 scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-950/80 to-slate-950" />
                </div>

                {/* Creative Read Trial Section - Premium Glassmorphism */}
                <div className="relative group w-full max-w-4xl px-4 mb-20">
                  {/* Floating Glowing Orbs */}
                  <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-64 h-64 bg-indigo-500/20 rounded-full blur-[120px] animate-pulse pointer-events-none" />
                  <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-64 h-64 bg-purple-500/20 rounded-full blur-[120px] animate-pulse delay-700 pointer-events-none" />

                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="relative overflow-hidden bg-slate-900/40 backdrop-blur-3xl rounded-[3.5rem] border border-white/10 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] group/container"
                  >
                    <button 
                      onClick={() => window.open(documentData.previewUrl, '_blank')}
                      className="w-full text-left flex flex-col md:flex-row items-center gap-12 p-8 md:p-16 relative overflow-hidden"
                    >
                      {/* Background Detail */}
                      <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 scale-150 pointer-events-none">
                        <BookOpen className="w-64 h-64 text-white" />
                      </div>

                      {/* Left Side: Creative Visual Stack */}
                      <div className="relative shrink-0 w-48 h-64 md:w-64 md:h-80 group/visual">
                        {/* Shadow layers */}
                        <div className="absolute inset-0 bg-indigo-600/20 rounded-2xl rotate-[-12deg] blur-sm transition-transform group-hover/container:rotate-[-15deg] duration-700" />
                        <div className="absolute inset-0 bg-indigo-400/20 rounded-2xl rotate-[-6deg] blur-sm transition-transform group-hover/container:rotate-[-8deg] duration-700 delay-75" />
                        
                        {/* Main "Book" Preview */}
                        <motion.div 
                          animate={{ y: [0, -10, 0] }}
                          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                          className="absolute inset-0 bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col"
                        >
                          <div className="h-1/3 bg-slate-50 border-b border-slate-100 flex items-center justify-center relative">
                            <img 
                              src={documentData.thumbnailUrl} 
                              alt="" 
                              className="absolute inset-0 w-full h-full object-cover opacity-20"
                              referrerPolicy="no-referrer"
                            />
                            <div className="bg-indigo-600 text-white p-3 rounded-xl shadow-lg relative z-10">
                              <Eye className="w-8 h-8" />
                            </div>
                          </div>
                          <div className="p-6 space-y-4">
                            <div className="h-2 w-3/4 bg-slate-100 rounded-full" />
                            <div className="h-2 w-full bg-slate-50 rounded-full" />
                            <div className="h-2 w-5/6 bg-slate-50 rounded-full" />
                            <div className="pt-4 flex gap-2">
                              <div className="h-1.5 w-1.5 rounded-full bg-indigo-200" />
                              <div className="h-1.5 w-1.5 rounded-full bg-indigo-200" />
                              <div className="h-1.5 w-1.5 rounded-full bg-indigo-200" />
                            </div>
                          </div>
                        </motion.div>
                      </div>

                      {/* Right Side: Copy & Action */}
                      <div className="flex-1 space-y-8 text-center md:text-left relative z-10">
                        <div className="space-y-4">
                          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
                            <Sparkles className="w-4 h-4 text-indigo-400" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300">Tính năng đọc thử bản quyền</span>
                          </div>
                          <h3 className="text-4xl md:text-5xl font-black text-white leading-[1.1] tracking-tight">
                            Khám phá nội dung <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 bg-300% animate-gradient">trước khi mua.</span>
                          </h3>
                          <p className="text-slate-400 font-medium text-lg max-w-md mx-auto md:mx-0">
                            Đã có hơn 1000+ người đọc thử và hài lòng với chất lượng kiến thức trong bộ tài liệu này.
                          </p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-6 pt-4">
                          <div className="relative group/btn">
                            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl blur opacity-30 group-hover/btn:opacity-100 transition-opacity" />
                            <div className="relative px-8 py-5 bg-white text-slate-900 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center gap-3 transition-transform group-hover/btn:-translate-y-1">
                              Nhấp để xem bản mẫu
                              <ArrowLeft className="w-5 h-5 rotate-180" />
                            </div>
                          </div>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                            Miễn phí • Không cần đăng ký
                          </p>
                        </div>
                      </div>
                    </button>
                  </motion.div>
                </div>

                {/* Corner Accents */}
                <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-600/5 rounded-br-full blur-3xl" />
                <div className="absolute bottom-0 right-0 w-40 h-40 bg-purple-600/5 rounded-tl-full blur-3xl" />
              </div>
              
              {!hasPurchased && (
                <div className="mt-6 flex items-center justify-between py-4 px-8 bg-indigo-50/50 border border-indigo-100 rounded-2xl group/notice hover:bg-indigo-100 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600/10 flex items-center justify-center text-indigo-600 group-hover/notice:scale-110 transition-transform">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-0.5">Bản xem trước miễn phí</p>
                      <p className="text-[10px] text-slate-500 font-medium tracking-tight">Mua bản gốc để nhận link tải trọn bộ tài liệu 100% chất lượng.</p>
                    </div>
                  </div>
                  <Sparkles className="w-5 h-5 text-indigo-600/40 hidden md:block" />
                </div>
              )}
            </div>

            <div className="bg-white p-10 rounded-[2.5rem] border border-white shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-8 leading-tight tracking-tight">
                {documentData.title}
              </h1>
              <div className="flex flex-wrap items-center gap-10 text-[#6B7280] text-sm mb-12 border-b border-slate-100 pb-12">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100">
                    <Download className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-slate-900 font-black text-xl block leading-none">{documentData.salesCount}</span>
                    <span className="text-[10px] uppercase font-black tracking-widest opacity-60">Lượt tài liệu</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-slate-900 font-black text-xl block leading-none">2026</span>
                    <span className="text-[10px] uppercase font-black tracking-widest opacity-60">Cập nhật THPT</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-auto">
                  <span className="px-6 py-2 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                    {documentData.category}
                  </span>
                </div>
              </div>

              <div className="prose prose-slate max-w-none">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Mô tả chi tiết</h3>
                <p className="text-slate-700 leading-[1.8] whitespace-pre-line text-lg font-medium">
                  {documentData.description}
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] sticky top-32 space-y-8 border border-white shadow-[0_20px_50px_rgba(0,0,0,0.06)] overflow-hidden relative">
              <div className="space-y-2">
                <span className="text-[#6B7280] text-[10px] font-black uppercase tracking-[0.2em]">Giá tài liệu</span>
                <div className="flex items-baseline gap-3">
                  <span className="text-5xl font-black text-indigo-600 tracking-tighter">{documentData.price.toLocaleString()}đ</span>
                  <span className="text-slate-300 line-through text-lg font-bold">{(documentData.price * 1.5).toLocaleString()}đ</span>
                </div>
              </div>

              <div className="space-y-3">
                {hasPurchased ? (
                  <button 
                    onClick={handleDownload}
                    disabled={downloading}
                    className="w-full py-5 bg-emerald-600 hover:bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 shadow-xl shadow-emerald-600/20"
                  >
                    {downloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                    Tải file gốc (.pdf)
                  </button>
                ) : (
                  <div className="space-y-4">
                    {requestStatus === 'pending' ? (
                      <div className="p-6 bg-indigo-50/50 border border-indigo-100 rounded-[2rem] text-center space-y-4 shadow-inner">
                        <Clock className="w-10 h-10 text-indigo-600 mx-auto animate-spin-pulse" />
                        <div>
                          <p className="text-slate-900 font-black text-sm uppercase tracking-widest">Đang chờ phê duyệt</p>
                          <p className="text-[10px] text-[#6B7280] font-medium mt-1 leading-relaxed">Yêu cầu của bạn đang được Admin kiểm tra.</p>
                        </div>
                        <button 
                          onClick={() => window.open('https://docs.google.com/forms/d/e/1FAIpQLSeu4HsdHzBD_9dWKcvEoPYW6aN8lcNC07OL9GfNPSkdyxmqEw/viewform?usp=sf_link', '_blank')}
                          className="text-[10px] text-indigo-600 font-black hover:underline uppercase tracking-widest"
                        >
                          Mở lại Form thanh toán
                        </button>
                      </div>
                    ) : (requestStatus === 'rejected' || processingRequest) ? (
                      <div className="p-6 bg-red-50/50 border border-red-100 rounded-[2rem] text-center space-y-3">
                        <AlertCircle className={`w-10 h-10 ${processingRequest ? 'text-indigo-500 animate-spin' : 'text-red-500'} mx-auto`} />
                        <p className={`${processingRequest ? 'text-indigo-900' : 'text-red-900'} font-black text-sm uppercase tracking-widest`}>
                          {processingRequest ? 'Đang gửi yêu cầu...' : 'Giao dịch bị từ chối'}
                        </p>
                        <p className="text-[10px] text-slate-500 font-medium font-bold">
                          {processingRequest ? 'Vui lòng chờ trong giây lát. Hệ thống đang ghi nhận yêu cầu mới của bạn.' : 'Yêu cầu trước đó chưa thành công. Vui lòng kiểm tra lại thông tin và gửi lại yêu cầu mới.'}
                        </p>
                        {!processingRequest && (
                          <button 
                            onClick={handlePurchase} 
                            className="w-full py-4 bg-red-600 hover:bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest mt-2 transition-all shadow-lg shadow-red-600/20 active:scale-95"
                          >
                            Gửi lại yêu cầu mua tài liệu
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <button 
                          onClick={handlePurchase}
                          disabled={processingRequest}
                          className="w-full py-5 bg-indigo-600 hover:bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.25em] transition-all shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                        >
                          {processingRequest ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <CreditCard className="w-5 h-5" />
                          )}
                          Thanh toán & Gửi yêu cầu
                        </button>
                      </div>
                    )}
                    <div className="p-6 bg-[#fdfaf3] border border-amber-100 rounded-[2rem]">
                      <p className="text-[10px] text-amber-600 leading-relaxed uppercase tracking-[0.25em] font-black mb-4 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        Quy trình mua hàng
                      </p>
                      <p className="text-[10px] text-slate-600 leading-[2] font-medium">
                        1. Nhấn <span className="text-indigo-600 font-black">"Thanh toán & Gửi yêu cầu"</span> để mở Form đăng ký.<br/>
                        2. Điền thông tin và thực hiện chuyển khoản theo hướng dẫn trong Form.<br/>
                        3. Chờ Admin phê duyệt tài liệu (thông thường từ 15-30 phút).<br/>
                        4. Sau khi duyệt, bạn có thể tải file ngay tại đây hoặc trong mục "Tài liệu của tôi".
                      </p>
                    </div>
                  </div>
                )}
                <p className="text-[9px] text-center text-[#6B7280]/60 uppercase tracking-[0.25em] leading-loose font-black pt-4">
                  Cam kết bảo mật & Quyền lợi trọn đời
                </p>
              </div>

              <div className="pt-8 border-t border-slate-50 space-y-5">
                <div className="flex items-center gap-4 text-[10px] font-black text-[#6B7280] uppercase tracking-widest">
                  <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </div>
                  <span>Cập nhật mới nhất: 2026</span>
                </div>
                <div className="flex items-center gap-4 text-[10px] font-black text-[#6B7280] uppercase tracking-widest">
                  <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </div>
                  <span>Format: PDF / High Quality</span>
                </div>
                <div className="flex items-center gap-4 text-[10px] font-black text-[#6B7280] uppercase tracking-widest">
                  <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  </div>
                  <span>Bảo hành nội dung trọn gói</span>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={handleShare}
                  className="flex-1 py-4 px-6 bg-slate-50 border border-slate-200 rounded-[1.25rem] text-[10px] font-black text-[#6B7280] flex items-center justify-center gap-2 hover:bg-indigo-600 hover:text-white transition-all uppercase tracking-widest shadow-sm"
                >
                  <Share2 className="w-4 h-4" /> Chia sẻ tài liệu
                </button>
              </div>
              
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl opacity-50 -z-10" />
            </div>

          </div>
          {/* Related Documents */}
          {relatedDocs.length > 0 && (
            <div className="lg:col-span-12 mt-20">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Tài liệu liên quan</h2>
                  <p className="text-[#6B7280] text-sm mt-1 font-medium">Khám phá thêm các tài liệu thuộc chuyên mục {documentData.category}.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {relatedDocs.map((relatedDoc) => (
                  <DocumentCard key={relatedDoc.id} document={relatedDoc} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
