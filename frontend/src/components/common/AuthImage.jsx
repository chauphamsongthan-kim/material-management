import { useEffect, useState } from 'react';

import axiosClient from '../../api/axiosClient';

const SERVER_URL =
  import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

// Hiển thị ảnh thiết bị từ /uploads.
// Ảnh chỉ dành cho người đã đăng nhập nên không thể dùng <img src> trực tiếp
// (thẻ img không gửi được token). Component này tải ảnh kèm token rồi hiển thị.
// Ảnh lỗi hoặc đang tải thì không hiển thị gì (giống hành vi cũ khi ảnh lỗi).
function AuthImage({ imageUrl, alt, className }) {
  const [loaded, setLoaded] = useState({ forUrl: null, src: '' });

  useEffect(() => {
    if (!imageUrl) {
      return undefined;
    }

    let cancelled = false;
    let objectUrl = '';

    axiosClient
      .get(`${SERVER_URL}${imageUrl}`, { responseType: 'blob' })
      .then((response) => {
        if (cancelled) return;

        objectUrl = URL.createObjectURL(response.data);
        setLoaded({ forUrl: imageUrl, src: objectUrl });
      })
      .catch(() => {
        // Không tải được ảnh: giữ nguyên biểu tượng mặc định
      });

    return () => {
      cancelled = true;

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [imageUrl]);

  if (!imageUrl || loaded.forUrl !== imageUrl || !loaded.src) {
    return null;
  }

  return <img src={loaded.src} alt={alt} className={className} />;
}

export default AuthImage;
