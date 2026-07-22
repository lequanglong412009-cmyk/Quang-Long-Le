import React, { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';

export const InAppBrowserBanner = () => {
  const [isInApp, setIsInApp] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent || navigator.vendor || (window as any).opera;
    const isFb = (ua.indexOf("FBAN") > -1) || (ua.indexOf("FBAV") > -1) || (ua.indexOf("FB_IAB") > -1);
    const isZalo = (ua.indexOf("Zalo") > -1);
    const isMessenger = (ua.indexOf("Messenger") > -1);
    const isInsta = (ua.indexOf("Instagram") > -1);
    
    if (isFb || isZalo || isMessenger || isInsta) {
      setIsInApp(true);
    }
  }, []);

  if (!isInApp) return null;

  return (
    <div className="bg-amber-500 text-white px-4 py-2.5 text-xs sm:text-sm font-medium flex items-center justify-center text-center shadow-md relative z-[100]">
      <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2 shrink-0 animate-pulse" />
      <span>
        ⚠️ Bạn đang dùng trình duyệt của ứng dụng (Zalo/FB). <br className="sm:hidden" />
        Vui lòng nhấn <span className="font-bold">biểu tượng 3 chấm (⋮)</span> ở góc phải và chọn <span className="font-bold">Mở bằng trình duyệt (Chrome/Safari)</span> để đăng nhập và tải tài liệu không bị lỗi.
      </span>
    </div>
  );
};
