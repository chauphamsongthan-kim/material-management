import { X } from 'lucide-react';

import GmailLinkCard from './GmailLinkCard';

// Cửa sổ liên kết Gmail cho Admin (cấp 1 và cấp 2), mở từ menu tài khoản.
function GmailLinkModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng"
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-md text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
        >
          <X size={18} />
        </button>

        <GmailLinkCard />
      </div>
    </div>
  );
}

export default GmailLinkModal;
