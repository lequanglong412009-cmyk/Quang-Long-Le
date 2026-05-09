import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Plus, Package, DollarSign, 
  Trash2, Edit, X, Loader2,
  Upload, Image as ImageIcon, Link as LinkIcon,
  ShieldCheck, CheckCircle, XCircle, Copy
} from 'lucide-react';
import { 
  getDocuments, uploadDocument, grantAccess, 
  rejectAccess, updateDocument, 
  deleteDocument, getDocumentFileUrl,
  getProfile,
  MARKEPLTACE_COLLECTIONS
} from '../services/marketplaceService';
import { Document, AccessRequest } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { getGoogleDriveThumbnail } from '../lib/utils';
import { db, auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, orderBy, onSnapshot, getDocs, doc, setDoc } from 'firebase/firestore';

const GRADES = ['Lớp 10', 'Lớp 11', 'Lớp 12'];
const SUBJECTS = ['Toán', 'Lí', 'Hóa', 'Sinh', 'Anh', 'Sử', 'Địa', 'Tin', 'Văn'];

export const AdminDashboard: React.FC = () => {
  const [docs, setDocs] = useState<Document[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingDoc, setEditingDoc] = useState<Document | null>(null);
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [requestFilter, setRequestFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [requestsError, setRequestsError] = useState<string | null>(null);
  const [view, setView] = useState<'docs' | 'requests'>('docs');
  
  // Custom UI State
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ 
    isOpen: boolean; 
    title: string; 
    message: string; 
    onConfirm: () => void;
    actionType: 'approve' | 'reject';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    actionType: 'approve'
  });

  const [submitting, setSubmitting] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState(GRADES[0]);
  const [selectedSubject, setSelectedSubject] = useState(SUBJECTS[0]);
  const [newDoc, setNewDoc] = useState({
    title: '',
    description: '',
    price: 0,
    category: `${GRADES[0]} | ${SUBJECTS[0]}`,
    difficulty: 'Intermediate' as 'Basic' | 'Intermediate' | 'Advanced',
    previewUrl: '',
    thumbnailUrl: '',
    status: 'Regular' as 'Hot' | 'Bestseller' | 'New' | 'Regular'
  });
  const [fileUrl, setFileUrl] = useState('');

  useEffect(() => {
    let unsubscribeRequests: (() => void) | null = null;
    let unsubscribePending: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      // Cleanup previous listeners if any
      if (unsubscribeRequests) unsubscribeRequests();
      if (unsubscribePending) unsubscribePending();

      console.log('AdminDashboard: Auth State Updated:', user?.email);
      
      if (!user || user.email !== 'tailieuhay53@gmail.com') {
        setRequestsError('Bạn không có quyền truy cập trang này. Vui lòng đăng nhập với tài khoản Admin.');
        setRequestsLoading(false);
        return;
      }

      // Ensure Profile is Admin (Server-side Rules will already enforce this via email check, but local cache might be useful)
      try {
        const profile = await getProfile(user.uid);
        if (profile && !profile.isAdmin) {
          const userRef = doc(db, MARKEPLTACE_COLLECTIONS.USERS, user.uid);
          await setDoc(userRef, { isAdmin: true }, { merge: true });
        }
      } catch (e) {
        console.error('Failed to sync admin flag:', e);
      }
      
      // 1. Initial fetch for documents
      const fetchDocs = async () => {
        try {
          const docsData = await getDocuments();
          setDocs(docsData);
        } catch (error) {
          console.error('Error fetching docs:', error);
        }
      };
      fetchDocs();

      // 2. Real-time listener for requests
      setRequestsLoading(true);
      const requestsCol = collection(db, MARKEPLTACE_COLLECTIONS.REQUESTS);
      let q = query(requestsCol);
      
      if (requestFilter !== 'all') {
        q = query(requestsCol, where('status', '==', requestFilter));
      }

      unsubscribeRequests = onSnapshot(q, (snapshot) => {
        const reqs = snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() } as AccessRequest));
        
        // Sort manually
        reqs.sort((a: AccessRequest, b: AccessRequest) => {
          const timeA = a.requestedAt?.seconds || Date.now() / 1000;
          const timeB = b.requestedAt?.seconds || Date.now() / 1000;
          return timeB - timeA;
        });

        setRequests(reqs);
        setRequestsLoading(false);
        setRequestsError(null);
      }, (error) => {
        console.error('Error in main requests listener:', error);
        setRequestsError(error.message);
        setRequestsLoading(false);
      });

      // 3. Pending count listener
      const qPending = query(
        collection(db, MARKEPLTACE_COLLECTIONS.REQUESTS),
        where('status', '==', 'pending')
      );
      unsubscribePending = onSnapshot(qPending, (snap) => {
        setPendingCount(snap.size);
      }, (error) => {
        console.error('Error in pending count listener:', error);
      });
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeRequests) unsubscribeRequests();
      if (unsubscribePending) unsubscribePending();
    };
  }, [requestFilter]);

  // Remove the separate listener for pending count badge as it's now inside the main one
  // ... (lines 111-120 were previously here)

  const refreshData = async () => {
    try {
      const docsData = await getDocuments();
      setDocs(docsData);
    } catch (error) {
      console.error(error);
    }
  };

  const refreshRequests = async () => {
    setRequestsLoading(true);
    try {
      const requestsCol = collection(db, MARKEPLTACE_COLLECTIONS.REQUESTS);
      let q = query(requestsCol);
      if (requestFilter !== 'all') {
        q = query(requestsCol, where('status', '==', requestFilter));
      }
      const snapshot = await getDocs(q);
      const reqs = snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() } as AccessRequest));
      reqs.sort((a: AccessRequest, b: AccessRequest) => {
        const timeA = a.requestedAt?.seconds || Date.now() / 1000;
        const timeB = b.requestedAt?.seconds || Date.now() / 1000;
        return timeB - timeA;
      });
      setRequests(reqs);
      setRequestsError(null);
    } catch (error) {
      setRequestsError(error instanceof Error ? error.message : 'Lỗi tải yêu cầu');
    } finally {
      setRequestsLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleApproveRequest = async (req: AccessRequest) => {
    setConfirmModal({
      isOpen: true,
      title: 'Phê duyệt yêu cầu',
      message: `Bạn có chắc muốn phê duyệt cho ${req.userEmail} tải "${req.documentTitle}"?`,
      actionType: 'approve',
      onConfirm: async () => {
        setLoadingAction(req.id);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          await grantAccess(req.userId, req.documentId);
          showToast('Đã phê duyệt và kích hoạt quyền tải cho người dùng!', 'success');
          await refreshData();
        } catch (error) {
          console.error(error);
          showToast('Phê duyệt thất bại: ' + (error instanceof Error ? error.message : String(error)), 'error');
        } finally {
          setLoadingAction(null);
        }
      }
    });
  };

  const handleEdit = async (doc: Document) => {
    setLoadingAction(doc.id);
    try {
      const internalUrl = await getDocumentFileUrl(doc.id);
      setFileUrl(internalUrl || '');
      setNewDoc({
        title: doc.title,
        description: doc.description,
        price: doc.price,
        category: doc.category,
        difficulty: doc.difficulty,
        previewUrl: doc.previewUrl,
        thumbnailUrl: doc.thumbnailUrl,
        status: doc.status
      });
      
      const [grade, subject] = doc.category.includes(' | ') 
        ? doc.category.split(' | ') 
        : [GRADES[0], doc.category];
      setSelectedGrade(grade);
      setSelectedSubject(subject);
      
      setEditingDoc(doc);
      setIsAdding(true);
    } catch (error) {
      console.error(error);
      showToast('Lỗi khi tải thông tin tài liệu', 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDelete = async (doc: Document) => {
    setConfirmModal({
      isOpen: true,
      title: 'Xóa tài liệu',
      message: `Bạn có chắc muốn xóa vĩnh viễn tài liệu "${doc.title}"? Thao tác này không thể hoàn tác.`,
      actionType: 'reject',
      onConfirm: async () => {
        setLoadingAction(doc.id);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          await deleteDocument(doc.id);
          showToast('Đã xóa tài liệu thành công!', 'success');
          await refreshData();
        } catch (error) {
          console.error(error);
          showToast('Xóa thất bại: ' + (error instanceof Error ? error.message : String(error)), 'error');
        } finally {
          setLoadingAction(null);
        }
      }
    });
  };

  const handleRejectRequest = async (req: AccessRequest) => {
    setConfirmModal({
      isOpen: true,
      title: 'Từ chối yêu cầu',
      message: `Bạn có chắc muốn từ chối yêu cầu của ${req.userEmail}?`,
      actionType: 'reject',
      onConfirm: async () => {
        setLoadingAction(req.id);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        try {
          await rejectAccess(req.userId, req.documentId);
          showToast('Đã từ chối yêu cầu.', 'success');
          await refreshData();
        } catch (error) {
          console.error(error);
          showToast('Từ chối thất bại: ' + (error instanceof Error ? error.message : String(error)), 'error');
        } finally {
          setLoadingAction(null);
        }
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileUrl) return showToast('File URL is required', 'error');
    
    setSubmitting(true);
    try {
      const docData = {
        ...newDoc,
        category: `${selectedGrade} | ${selectedSubject}`,
        thumbnailUrl: getGoogleDriveThumbnail(newDoc.thumbnailUrl)
      };

      if (editingDoc) {
        await updateDocument(editingDoc.id, docData, fileUrl);
        showToast('Cập nhật tài liệu thành công!', 'success');
      } else {
        await uploadDocument(docData, fileUrl);
        showToast('Đăng tài liệu thành công!', 'success');
      }

      setIsAdding(false);
      setEditingDoc(null);
      // Reset form and refresh
      setNewDoc({
        title: '', description: '', price: 0, 
        category: `${GRADES[0]} | ${SUBJECTS[0]}`, difficulty: 'Intermediate',
        previewUrl: '', thumbnailUrl: '', status: 'Regular'
      });
      setFileUrl('');
      await refreshData();
    } catch (error) {
      console.error(error);
      showToast('Thao tác thất bại: ' + (error instanceof Error ? error.message : String(error)), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const totalSales = docs.reduce((acc, d) => acc + d.salesCount, 0);
  const totalRevenue = docs.reduce((acc, d) => acc + (d.salesCount * d.price), 0);

  return (
    <div className="min-h-screen bg-[#F5F7FF] pt-28 pb-20 text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Atmosphere background elements */}
        <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-[120px] pointer-events-none" />

        {/* Top Notification Banner for Admin */}
        <AnimatePresence>
          {pendingCount > 0 && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-8"
            >
              <div className="bg-indigo-600 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl shadow-indigo-600/20 border border-indigo-400/30">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white relative">
                    <ShieldCheck className="w-6 h-6" />
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
                  </div>
                  <div>
                    <h3 className="text-white font-black text-lg tracking-tight">Có {pendingCount} yêu cầu mới đang chờ duyệt!</h3>
                    <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-widest">Vui lòng kiểm tra và phê duyệt cho học sinh ngay.</p>
                  </div>
                </div>
                <button 
                  onClick={() => { setView('requests'); setRequestFilter('pending'); }}
                  className="px-8 py-3 bg-white text-indigo-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all shadow-xl active:scale-95"
                >
                  Xử lý ngay bây giờ
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-indigo-600 font-black text-[10px] uppercase tracking-[0.3em]">
              <ShieldCheck className="w-5 h-5" /> Hệ thống quản trị
            </div>
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter">Bảng Điều Khiển</h1>
            <p className="text-[#6B7280] font-medium max-w-md">Kiểm soát kho học liệu và vận hành thương mại của nền tảng Tài liệu hay.</p>
          </div>
          
          <div className="flex gap-4">
            <button 
              onClick={() => {
                setEditingDoc(null);
                setNewDoc({
                  title: '', description: '', price: 0, 
                  category: `${GRADES[0]} | ${SUBJECTS[0]}`, difficulty: 'Intermediate',
                  previewUrl: '', thumbnailUrl: '', status: 'Regular'
                });
                setFileUrl('');
                setIsAdding(true);
              }}
              className="group flex items-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-white text-white hover:text-indigo-600 rounded-[2rem] font-black uppercase tracking-widest text-[11px] transition-all shadow-2xl shadow-indigo-600/20 active:scale-95"
            >
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" /> 
              <span>Đăng tài liệu mới</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <motion.div 
            whileHover={{ y: -10, scale: 1.02 }}
            className="bg-white p-8 rounded-[2.5rem] border border-white relative overflow-hidden group shadow-[0_10px_30px_rgba(0,0,0,0.04)]"
          >
            <div className="flex items-center justify-between mb-8 relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                <Package className="w-8 h-8" />
              </div>
              <div className="text-right">
                <span className="text-[10px] text-blue-600/60 font-black uppercase tracking-[0.2em]">Storage</span>
              </div>
            </div>
            <div className="space-y-1 relative z-10">
              <div className="text-[11px] text-[#6B7280] font-black uppercase tracking-widest">Tổng kho tài liệu</div>
              <div className="text-5xl font-black text-slate-900 tracking-tighter">{docs.length}</div>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl opacity-50" />
          </motion.div>

          <motion.div 
            whileHover={{ y: -10, scale: 1.02 }}
            className="bg-white p-8 rounded-[2.5rem] border border-white relative overflow-hidden group shadow-[0_10px_30px_rgba(0,0,0,0.04)]"
          >
            <div className="flex items-center justify-between mb-8 relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 shadow-sm group-hover:scale-110 group-hover:-rotate-6 transition-all duration-500">
                <BarChart3 className="w-8 h-8" />
              </div>
              <div className="text-right">
                <span className="text-[10px] text-purple-600/60 font-black uppercase tracking-[0.2em]">Activity</span>
              </div>
            </div>
            <div className="space-y-1 relative z-10">
              <div className="text-[11px] text-[#6B7280] font-black uppercase tracking-widest">Lượt tải học sinh</div>
              <div className="text-5xl font-black text-slate-900 tracking-tighter">{totalSales.toLocaleString()}</div>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-full blur-3xl opacity-50" />
          </motion.div>

          <motion.div 
            whileHover={{ y: -10, scale: 1.02 }}
            className="bg-white p-8 rounded-[2.5rem] border border-white relative overflow-hidden group shadow-[0_10px_30px_rgba(0,0,0,0.04)]"
          >
            <div className="flex items-center justify-between mb-8 relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
                <DollarSign className="w-8 h-8" />
              </div>
              <div className="text-right">
                <span className="text-[10px] text-emerald-600/60 font-black uppercase tracking-[0.2em]">Revenue</span>
              </div>
            </div>
            <div className="space-y-1 relative z-10">
              <div className="text-[11px] text-[#6B7280] font-black uppercase tracking-widest">Ước tính doanh thu</div>
              <div className="text-5xl font-black text-emerald-600 tracking-tighter">{totalRevenue.toLocaleString()}đ</div>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl opacity-50" />
          </motion.div>
        </div>

        {/* Action Tabs */}
        <div className="flex gap-10 mb-10 border-b border-slate-200">
          <button 
            onClick={() => setView('docs')}
            className={`pb-5 text-[11px] font-black uppercase tracking-[0.25em] transition-all relative ${view === 'docs' ? 'text-indigo-600' : 'text-[#6B7280] hover:text-indigo-600'}`}
          >
            Kho dữ liệu ({docs.length})
            {view === 'docs' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 w-full h-1 bg-indigo-600 rounded-t-full" />}
          </button>
          <button 
            onClick={() => setView('requests')}
            className={`pb-5 text-[11px] font-black uppercase tracking-[0.25em] transition-all relative flex items-center gap-3 ${view === 'requests' ? 'text-indigo-600' : 'text-[#6B7280] hover:text-indigo-600'}`}
          >
            Duyệt yêu cầu
            {pendingCount > 0 && (
              <span className="relative flex h-5 w-5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-5 w-5 bg-red-600 text-white text-[9px] items-center justify-center font-black">
                  {pendingCount}
                </span>
              </span>
            )}
            {view === 'requests' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 w-full h-1 bg-indigo-600 rounded-t-full" />}
          </button>
        </div>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          {view === 'docs' ? (
            <motion.div 
              key="docs"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="glass rounded-[2rem] overflow-hidden border-white/5 shadow-3xl"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-100 bg-white">
                      <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-[#6B7280]">Tài liệu</th>
                      <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-[#6B7280]">Danh mục & Khối</th>
                      <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-[#6B7280]">Giá tài liệu</th>
                      <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-[#6B7280] text-center">Hoạt động</th>
                      <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-[#6B7280] text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {docs.map(doc => (
                      <tr key={doc.id} className="group hover:bg-slate-50/50 transition-all duration-300">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-5">
                            <div className="relative">
                              <img 
                                src={getGoogleDriveThumbnail(doc.thumbnailUrl)} 
                                className="w-14 h-14 rounded-2xl object-cover shadow-lg border border-white group-hover:scale-110 transition-transform duration-500" 
                                referrerPolicy="no-referrer"
                              />
                              {doc.status !== 'Regular' && (
                                <span className={`absolute -top-2 -right-2 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest text-white shadow-xl ${
                                  doc.status === 'Hot' ? 'bg-red-600' : doc.status === 'Bestseller' ? 'bg-amber-500' : 'bg-emerald-500'
                                }`}>
                                  {doc.status}
                                </span>
                              )}
                            </div>
                            <div className="space-y-1">
                              <div className="font-black text-md text-slate-900 tracking-tight leading-tight">{doc.title}</div>
                              <div className="flex items-center gap-3">
                                <code className="text-[9px] text-[#6B7280] font-mono opacity-50">{doc.id}</code>
                                <button 
                                  onClick={() => {
                                    navigator.clipboard.writeText(doc.id);
                                    showToast('Đã copy ID document', 'success');
                                  }}
                                  className="text-slate-400 hover:text-indigo-600 p-1 transition-colors"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className="px-4 py-1.5 bg-indigo-50 border border-indigo-100/50 rounded-full text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                            {doc.category}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <div className="text-xl font-black text-indigo-600 tracking-tighter">
                            {doc.price.toLocaleString()}đ
                          </div>
                        </td>
                        <td className="px-8 py-6 text-center">
                          <div className="inline-flex flex-col items-center gap-1">
                            <span className="px-3 py-1 bg-slate-50 text-[#6B7280] rounded-xl text-[11px] font-black tracking-tight border border-slate-100">
                              Đã bán: {doc.salesCount}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => handleEdit(doc)}
                              disabled={loadingAction === doc.id}
                              className="p-3 bg-indigo-50 text-[#6B7280] hover:text-indigo-600 rounded-xl transition-all hover:bg-white border border-indigo-50 disabled:opacity-50 shadow-sm"
                            >
                              {loadingAction === doc.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Edit className="w-5 h-5" />}
                            </button>
                            <button 
                              onClick={() => handleDelete(doc)}
                              disabled={loadingAction === doc.id}
                              className="p-3 bg-red-50 text-red-400 hover:text-red-500 rounded-xl transition-all hover:bg-white border border-red-50 disabled:opacity-50 shadow-sm"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {docs.length === 0 && (
                <div className="py-24 text-center">
                   <div className="w-20 s-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Package className="w-10 h-10 text-slate-700" />
                   </div>
                   <h3 className="text-slate-400 font-bold">Chưa có tài liệu giáo khoa nào</h3>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="requests"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="glass rounded-[2rem] overflow-hidden border-white/5 shadow-3xl"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white flex-wrap gap-6">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Danh sách yêu cầu</h3>
                  <div className="flex gap-4 mt-3">
                    {['pending', 'approved', 'rejected', 'all'].map((f) => (
                      <button
                        key={f}
                        onClick={() => setRequestFilter(f as any)}
                        className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                          requestFilter === f 
                            ? 'bg-indigo-600 text-white shadow-lg' 
                            : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                        }`}
                      >
                        {f === 'pending' ? 'Chờ duyệt' : f === 'approved' ? 'Đã duyệt' : f === 'rejected' ? 'Đã từ chối' : 'Tất cả'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-4">
                  <button 
                    onClick={refreshRequests}
                    disabled={requestsLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all disabled:opacity-50"
                  >
                    <Loader2 className={`w-3 h-3 ${requestsLoading ? 'animate-spin' : ''}`} />
                    Làm mới
                  </button>
                </div>
              </div>

              {requestsError && (
                <div className="p-8 bg-red-50 border-b border-red-100 flex items-center gap-3 text-red-600 text-xs font-bold">
                  <XCircle className="w-4 h-4" />
                  <span>Lỗi: {requestsError}</span>
                  <button onClick={refreshRequests} className="underline ml-auto">Thử lại</button>
                </div>
              )}

              {requestsLoading && requests.length === 0 ? (
                <div className="py-32 text-center">
                  <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto mb-4" />
                  <p className="text-slate-400 font-bold text-sm">Đang tải yêu cầu...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/30">
                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-[#6B7280]">Người mua</th>
                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-[#6B7280]">Sản phẩm yêu cầu</th>
                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-[#6B7280] text-center">Trạng thái</th>
                        <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-[#6B7280] text-right">Phê duyệt nhanh</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {requests.map(req => (
                        <tr key={req.id} className="group hover:bg-slate-50/50 transition-all">
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-[10px] font-black uppercase tracking-tighter text-white">
                                {req.userEmail.charAt(0)}
                              </div>
                              <div>
                                <div className="text-sm font-black text-slate-900 tracking-tight">{req.userEmail}</div>
                                <div className="flex items-center gap-2 text-[11px] text-[#6B7280] font-bold">
                                  <span>ID: {req.userId.substring(0, 8)}...</span>
                                  <button onClick={() => { 
                                    navigator.clipboard.writeText(req.userId); 
                                    showToast('Đã copy User ID', 'success');
                                  }} className="hover:text-indigo-600">
                                    <Copy className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="space-y-1">
                              <div className="text-sm text-indigo-600 font-black tracking-tight">{req.documentTitle}</div>
                              <div className="text-[10px] text-[#6B7280] font-mono">{req.documentId}</div>
                            </div>
                          </td>
                          <td className="px-8 py-6 text-center">
                            <div className="space-y-1">
                              <span className={`px-4 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest inline-block ${
                                req.status === 'pending' ? 'bg-amber-100 text-amber-600' : 
                                req.status === 'approved' ? 'bg-emerald-100 text-emerald-600' :
                                'bg-red-100 text-red-600'
                              }`}>
                                {req.status === 'pending' ? 'Chờ duyệt' : req.status === 'approved' ? 'Đã duyệt' : 'Từ chối'}
                              </span>
                              <div className="text-[9px] text-slate-400 font-medium">
                                {req.requestedAt?.toDate ? req.requestedAt.toDate().toLocaleDateString('vi-VN') : 'Vừa xong'}
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6 text-right">
                             <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                              {req.status !== 'approved' && (
                                <button 
                                  onClick={() => handleApproveRequest(req)}
                                  disabled={loadingAction === req.id}
                                  className="p-3 bg-emerald-50 text-emerald-500 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all shadow-lg shadow-emerald-600/10 active:scale-90 border border-emerald-50"
                                  title="Duyệt"
                                >
                                  {loadingAction === req.id ? <Loader2 className="w-6 h-6 animate-spin" /> : <CheckCircle className="w-6 h-6" />}
                                </button>
                              )}
                              {req.status === 'pending' && (
                                <button 
                                  onClick={() => handleRejectRequest(req)}
                                  disabled={loadingAction === req.id}
                                  className="p-3 bg-red-50 text-red-400 rounded-2xl hover:bg-red-600 hover:text-white transition-all shadow-lg shadow-red-500/10 active:scale-90 border border-red-50" 
                                  title="Hủy bỏ"
                                >
                                  <XCircle className="w-6 h-6" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              
              {!requestsLoading && requests.length === 0 && !requestsError && (
                <div className="py-32 text-center">
                  <ShieldCheck className="w-20 h-20 text-slate-900 mx-auto mb-6" />
                  <div className="text-slate-500 font-black uppercase tracking-[0.2em] text-sm">
                    {requestFilter === 'pending' ? 'Tất cả yêu cầu đã được xử lý xong' : 'Không có yêu cầu nào trong danh mục này'}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Upload Modal (Overlay for demo simplicity) */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto p-12 rounded-[3.5rem] border border-white shadow-[0_20px_70px_rgba(0,0,0,0.15)] relative"
            >
              <div className="flex items-center justify-between mb-12">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">{editingDoc ? 'Cập Nhật Tài Liệu' : 'Tạo Tài Liệu Mới'}</h2>
                  <p className="text-[#6B7280] text-sm mt-1 font-medium">Hoàn thiện thông tin để học sinh có thể tiếp cận tốt nhất.</p>
                </div>
                <button 
                  onClick={() => { setIsAdding(false); setEditingDoc(null); }} 
                  className="w-12 h-12 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all border border-slate-100 shadow-sm"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-10 text-slate-900">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#6B7280] ml-1">Tên tài liệu chính thức</label>
                    <input 
                      required
                      type="text" 
                      className="w-full px-6 py-4 bg-slate-50 rounded-2xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-300 font-bold"
                      placeholder="Ví dụ: Đề thi thử Toán THPTQG 2026..."
                      value={newDoc.title}
                      onChange={e => setNewDoc({...newDoc, title: e.target.value})}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#6B7280] ml-1">Giá bán (VNĐ)</label>
                    <div className="relative">
                       <input 
                        required
                        type="number" 
                        className="w-full px-6 py-4 bg-slate-50 rounded-2xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 font-black text-xl text-indigo-600"
                        value={newDoc.price}
                        onChange={e => {
                          const val = parseInt(e.target.value);
                          setNewDoc({...newDoc, price: isNaN(val) ? 0 : val});
                        }}
                      />
                      <span className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 font-black">đ</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#6B7280] ml-1">Nội dung tóm tắt</label>
                  <textarea 
                    rows={4} 
                    className="w-full px-6 py-4 bg-slate-50 rounded-2xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 font-medium leading-relaxed"
                    placeholder="Học sinh sẽ đọc nội dung này để quyết định tải xuống..."
                    value={newDoc.description}
                    onChange={e => setNewDoc({...newDoc, description: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#6B7280] ml-1">Cấp độ khối lớp</label>
                    <select 
                      className="w-full px-6 py-4 bg-slate-50 rounded-2xl border border-slate-200 font-bold text-slate-700"
                      value={selectedGrade}
                      onChange={e => setSelectedGrade(e.target.value)}
                    >
                      {GRADES.map(g => <option key={g}>{g}</option>)}
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#6B7280] ml-1">Bộ môn học tập</label>
                    <select 
                      className="w-full px-6 py-4 bg-slate-50 rounded-2xl border border-slate-200 font-bold text-slate-700"
                      value={selectedSubject}
                      onChange={e => setSelectedSubject(e.target.value)}
                    >
                      {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#6B7280] ml-1">Thẻ định danh thương mại</label>
                    <select 
                      className="w-full px-6 py-4 bg-slate-50 rounded-2xl border border-slate-200 font-black text-indigo-600 uppercase tracking-widest"
                      value={newDoc.status}
                      onChange={e => setNewDoc({...newDoc, status: e.target.value as 'Hot' | 'Bestseller' | 'New' | 'Regular'})}
                    >
                      <option className="text-slate-400">Regular</option>
                      <option className="text-red-500 font-black">Hot</option>
                      <option className="text-amber-500 font-black">Bestseller</option>
                      <option className="text-emerald-500 font-black">New</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-8 pt-10 border-t border-slate-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-indigo-600 flex items-center gap-2 font-black">
                        <LinkIcon className="w-4 h-4" /> Link Demo / Preview
                      </label>
                      <input 
                        required
                        placeholder="Link Google Drive PDF (Chế độ xem)"
                        className="w-full px-5 py-3 bg-indigo-50/30 rounded-xl text-xs font-mono border border-indigo-100 text-indigo-600 font-bold"
                        value={newDoc.previewUrl}
                        onChange={e => setNewDoc({...newDoc, previewUrl: e.target.value})}
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-indigo-600 flex items-center gap-2 font-black">
                        <ImageIcon className="w-4 h-4" /> Link Ảnh Bìa
                      </label>
                      <input 
                        required
                        placeholder="Link ảnh bìa tài liệu"
                        className="w-full px-5 py-3 bg-indigo-50/30 rounded-xl text-xs font-mono border border-indigo-100 text-indigo-600 font-bold"
                        value={newDoc.thumbnailUrl}
                        onChange={e => setNewDoc({...newDoc, thumbnailUrl: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-3 p-8 bg-[#fdfaf3] rounded-[2rem] border border-amber-100">
                    <label className="text-[10px] font-black uppercase tracking-widest text-amber-600 flex items-center gap-2 font-black">
                      <ShieldCheck className="w-4 h-4" /> Đường dẫn tải tài liệu gốc (Ẩn danh)
                    </label>
                    <input 
                      required
                      placeholder="Chỉ người đã thanh toán mới thấy đường dẫn này"
                      className="w-full px-5 py-4 bg-white rounded-xl text-xs font-mono border border-amber-200 text-amber-700 shadow-sm"
                      value={fileUrl}
                      onChange={e => setFileUrl(e.target.value)}
                    />
                    <p className="text-[9px] text-[#6B7280] font-bold flex items-center gap-2">
                       <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                       Hệ thống sẽ tự động gửi link này sau khi Admin phê duyệt thanh toán.
                    </p>
                  </div>
                </div>

                <div className="flex gap-6 pt-6">
                  <button type="button" onClick={() => { setIsAdding(false); setEditingDoc(null); }} className="flex-1 py-5 bg-slate-50 hover:bg-slate-100 text-[#6B7280] rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all border border-slate-200">Hủy</button>
                  <button type="submit" disabled={submitting} className="flex-[2] py-5 bg-indigo-600 hover:bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-3 transition-all shadow-xl shadow-indigo-600/30 active:scale-95 disabled:opacity-50">
                    {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
                    {editingDoc ? 'Xác nhận lưu thay đổi' : 'Công bố tài liệu này'}
                  </button>
                </div>
              </form>
              
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl opacity-50 -z-10" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="bg-white max-w-md w-full p-10 rounded-[2.5rem] border border-white shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden relative"
            >
              <div className={`absolute top-0 left-0 w-full h-1.5 ${confirmModal.actionType === 'approve' ? 'bg-emerald-500' : 'bg-red-500'}`} />
              
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${confirmModal.actionType === 'approve' ? 'bg-emerald-50 text-emerald-500' : 'bg-red-50 text-red-500'}`}>
                  {confirmModal.actionType === 'approve' ? <CheckCircle className="w-6 h-6" /> : <Trash2 className="w-6 h-6" />}
                </div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{confirmModal.title}</h3>
              </div>
              
              <p className="text-[#6B7280] mb-10 leading-relaxed font-medium">{confirmModal.message}</p>
              
              <div className="flex gap-4">
                <button 
                  onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                  className="flex-1 py-4 bg-slate-50 hover:bg-slate-100 text-[#6B7280] rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all border border-slate-200"
                >
                  Hủy bỏ
                </button>
                <button 
                  onClick={confirmModal.onConfirm}
                  className={`flex-1 py-4 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-xl active:scale-95 ${
                    confirmModal.actionType === 'approve' ? 'bg-emerald-600 hover:bg-slate-900 shadow-emerald-500/20' : 'bg-red-600 hover:bg-slate-900 shadow-red-500/20'
                  }`}
                >
                  Xác nhận ngay
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[300]">
            <motion.div 
              initial={{ opacity: 0, y: 40, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.9, transition: { duration: 0.2 } }}
              className={`px-8 py-4 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex items-center gap-4 backdrop-blur-xl border border-white ${
                toast.type === 'success' ? 'bg-emerald-600/90 text-white' : 'bg-red-600/90 text-white'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
              </div>
              <span className="font-black text-xs uppercase tracking-widest leading-none">{toast.message}</span>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
