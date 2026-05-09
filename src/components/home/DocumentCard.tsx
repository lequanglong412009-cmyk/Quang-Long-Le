import React from 'react';
import { Link } from 'react-router-dom';
import { Download, Eye, Tag } from 'lucide-react';
import { Document } from '../../types';
import { motion } from 'motion/react';
import { getGoogleDriveThumbnail } from '../../lib/utils';

interface Props {
  document: Document;
}

export const DocumentCard: React.FC<Props> = ({ document }) => {
  const [grade, subject] = document.category.includes(' | ') 
    ? document.category.split(' | ') 
    : [null, document.category];

  return (
    <motion.div
      whileHover={{ y: -12, scale: 1.02 }}
      className="group bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(91,95,248,0.15)] transition-all duration-500"
    >
      <Link to={`/documents/${document.id}`} className="block relative aspect-[5/4] overflow-hidden">
        <img 
          src={getGoogleDriveThumbnail(document.thumbnailUrl)} 
          alt={document.title} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6 backdrop-blur-[2px]">
          <button className="w-full py-4 bg-white text-indigo-600 rounded-2xl flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest shadow-2xl transform translate-y-4 group-hover:translate-y-0 transition-all duration-500">
            <Eye className="w-4 h-4" /> Xem chi tiết
          </button>
        </div>
        
        {/* Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          {grade && (
            <span className="px-3 py-1 bg-indigo-600 text-white text-[9px] font-black uppercase tracking-widest rounded-lg shadow-lg">{grade}</span>
          )}
          {document.status === 'Hot' && (
            <span className="px-3 py-1 bg-red-500 text-white text-[9px] font-black uppercase tracking-widest rounded-lg shadow-lg">Hot</span>
          )}
          {document.status === 'Bestseller' && (
            <span className="px-3 py-1 bg-amber-500 text-white text-[9px] font-black uppercase tracking-widest rounded-lg shadow-lg">Bán chạy</span>
          )}
          {document.status === 'New' && (
            <span className="px-3 py-1 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest rounded-lg shadow-lg">Mới</span>
          )}
        </div>
      </Link>

      <div className="p-8">
        <div className="flex items-center gap-2 mb-4 text-indigo-600 text-[10px] font-black uppercase tracking-[0.2em] bg-indigo-50 w-fit px-3 py-1.5 rounded-lg">
          <Tag className="w-3 h-3" /> {subject || document.category}
        </div>
        <Link to={`/documents/${document.id}`}>
          <h3 className="text-xl font-black text-slate-900 mb-4 line-clamp-2 hover:text-indigo-600 transition-colors leading-tight tracking-tight">
            {document.title}
          </h3>
        </Link>
        
        <div className="flex items-center gap-4 mb-8 text-[#6B7280] text-[10px] font-bold uppercase tracking-widest">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-lg">
            <Download className="w-3.5 h-3.5" />
            <span>{document.salesCount} lượt tải</span>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 pt-6">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#6B7280] mb-1">Giá tài liệu</span>
            <span className="text-2xl font-black text-indigo-600">
              {document.price === 0 ? 'Miễn phí' : `${document.price.toLocaleString()}đ`}
            </span>
          </div>
          <Link 
            to={`/documents/${document.id}`}
            className="w-14 h-14 rounded-[1.25rem] bg-indigo-600 text-white hover:bg-slate-900 flex items-center justify-center transition-all active:scale-90 shadow-xl shadow-indigo-600/20"
          >
            <Download className="w-6 h-6" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
};
