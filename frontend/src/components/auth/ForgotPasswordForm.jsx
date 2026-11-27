import { useState } from 'react';
import { ArrowLeft, LoaderCircle, MailCheck } from 'lucide-react';

import { forgotPassword, resetPassword } from '../../api/authApi';

const inputClass =
  'w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20';

// Quên mật khẩu bằng Gmail đã liên kết: bước 1 nhập tên đăng nhập, bước 2 nhập mã + mật khẩu mới.
function ForgotPasswordForm({ initialUsername = '', onBack, onDone }) {
  const [step, setStep] = useState('request'); // 'request' | 'reset'
  const [username, setUsername] = useState(initialUsername);
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const handleRequest = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Vui lòng nhập tên đăng nhập.');
      return;
    }

    try {
      setLoading(true);
      const result = await forgotPassword(username.trim());

      setInfo(
        result.message ||
          'Nếu tài khoản đã liên kết Gmail, mã khôi phục sẽ được gửi tới Gmail đó.'
      );
      setStep('reset');
    } catch (err) {
      setError(
        err.response?.data?.message || 'Không thể kết nối đến máy chủ.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');

    if (!/^\d{6}$/.test(code.trim())) {
      setError('Mã khôi phục gồm 6 chữ số.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    try {
      setLoading(true);
      const result = await resetPassword(
        username.trim(),
        code.trim(),
        newPassword
      );

      onDone(
        result.message ||
          'Đã đặt lại mật khẩu. Vui lòng đăng nhập bằng mật khẩu mới.'
      );
    } catch (err) {
      setError(
        err.response?.data?.message || 'Không thể kết nối đến máy chủ.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="mb-5 flex items-center gap-1.5 text-sm font-medium text-gray-500 transition hover:text-amber-600"
      >
        <ArrowLeft size={16} />
        Quay lại đăng nhập
      </button>

      <h2 className="text-xl font-bold text-gray-800">Quên mật khẩu</h2>

      <p className="mt-1 mb-5 text-sm text-gray-500">
        Chỉ tài khoản đã liên kết Gmail mới tự khôi phục được. Tài khoản khác
        vui lòng liên hệ Admin để được đặt lại mật khẩu.
      </p>

      {error && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {step === 'request' ? (
        <form onSubmit={handleRequest}>
          <label className="mb-2 block text-sm font-semibold text-gray-700">
            Tên đăng nhập
          </label>

          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={`${inputClass} mb-6`}
            placeholder="Nhập tên đăng nhập"
            autoComplete="username"
          />

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500 py-3 font-bold text-white shadow-lg shadow-amber-500/20 transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading && <LoaderCircle size={18} className="animate-spin" />}
            Gửi mã tới Gmail
          </button>
        </form>
      ) : (
        <form onSubmit={handleReset}>
          <div className="mb-5 flex gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            <MailCheck size={18} className="mt-0.5 shrink-0" />
            <span>{info}</span>
          </div>

          <label className="mb-2 block text-sm font-semibold text-gray-700">
            Mã khôi phục (6 chữ số)
          </label>

          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            className={`${inputClass} mb-5 text-center text-xl tracking-[0.4em]`}
            placeholder="······"
            autoComplete="one-time-code"
          />

          <label className="mb-2 block text-sm font-semibold text-gray-700">
            Mật khẩu mới
          </label>

          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className={`${inputClass} mb-5`}
            placeholder="Tối thiểu 6 ký tự"
            autoComplete="new-password"
          />

          <label className="mb-2 block text-sm font-semibold text-gray-700">
            Nhập lại mật khẩu mới
          </label>

          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={`${inputClass} mb-6`}
            placeholder="Nhập lại mật khẩu mới"
            autoComplete="new-password"
          />

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500 py-3 font-bold text-white shadow-lg shadow-amber-500/20 transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading && <LoaderCircle size={18} className="animate-spin" />}
            Đặt lại mật khẩu
          </button>

          <button
            type="button"
            onClick={() => {
              setStep('request');
              setCode('');
              setError('');
            }}
            className="mt-4 w-full text-center text-sm text-gray-500 transition hover:text-amber-600"
          >
            Chưa nhận được mã? Gửi lại
          </button>
        </form>
      )}
    </div>
  );
}

export default ForgotPasswordForm;
