import { useCallback, useEffect, useState } from 'react';
import { LoaderCircle, Mail, MailCheck, ShieldCheck } from 'lucide-react';

import {
  getEmailStatus,
  requestEmailLink,
  unlinkEmail,
  verifyEmailLink,
} from '../../api/authApi';

const inputClass =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100';

// Khung liên kết Gmail dành cho Admin (cấp 1 và cấp 2): khôi phục tài khoản khi quên mật khẩu.
function GmailLinkCard() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const [mode, setMode] = useState('idle'); // idle | email | code | unlink
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadStatus = useCallback(async () => {
    try {
      const result = await getEmailStatus();
      setStatus(result.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải trạng thái Gmail.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    getEmailStatus()
      .then((result) => {
        if (!cancelled) setStatus(result.data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err.response?.data?.message || 'Không thể tải trạng thái Gmail.'
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const reset = () => {
    setMode('idle');
    setEmail('');
    setCode('');
    setPassword('');
    setError('');
  };

  const run = async (fn, onOk) => {
    setError('');
    setMessage('');
    try {
      setBusy(true);
      const result = await fn();
      onOk(result);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể kết nối đến máy chủ.');
    } finally {
      setBusy(false);
    }
  };

  const handleRequest = (e) => {
    e.preventDefault();
    run(
      () => requestEmailLink(email.trim()),
      (result) => {
        setMessage(result.message || 'Đã gửi mã xác nhận tới Gmail.');
        setMode('code');
      }
    );
  };

  const handleVerify = (e) => {
    e.preventDefault();
    run(
      () => verifyEmailLink(email.trim(), code.trim()),
      async (result) => {
        reset();
        setMessage(result.message || 'Đã liên kết Gmail.');
        await loadStatus();
      }
    );
  };

  const handleUnlink = (e) => {
    e.preventDefault();
    run(
      () => unlinkEmail(password),
      async (result) => {
        reset();
        setMessage(result.message || 'Đã hủy liên kết Gmail.');
        await loadStatus();
      }
    );
  };

  const primaryBtn =
    'flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60';
  const ghostBtn =
    'rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-100';

  return (
    <div className="rounded-2xl bg-white p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
          {status?.linked ? <ShieldCheck size={20} /> : <Mail size={20} />}
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-gray-800">
            Liên kết Gmail
          </h2>

          {loading ? (
            <p className="mt-1 flex items-center gap-2 text-sm text-gray-500">
              <LoaderCircle size={15} className="animate-spin" />
              Đang tải...
            </p>
          ) : status?.linked ? (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-green-700">
              <MailCheck size={16} />
              Đã liên kết: <strong>{status.email_masked}</strong>
            </p>
          ) : (
            <p className="mt-1 text-sm text-gray-500">
              Chưa liên kết. Liên kết Gmail để có thể khôi phục tài khoản bằng
              mã gửi về Gmail khi quên mật khẩu.
            </p>
          )}

          {status && !status.mail_configured && (
            <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Máy chủ chưa cấu hình gửi email (SMTP) nên chưa thể gửi mã. Vui
              lòng cấu hình biến SMTP_* trên máy chủ.
            </p>
          )}

          {message && (
            <p className="mt-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
              {message}
            </p>
          )}

          {error && (
            <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          {!loading && mode === 'idle' && status && (
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className={primaryBtn}
                onClick={() => {
                  setMessage('');
                  setMode('email');
                }}
              >
                {status.linked ? 'Đổi Gmail' : 'Liên kết Gmail'}
              </button>

              {status.linked && (
                <button
                  type="button"
                  className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 transition hover:bg-red-100"
                  onClick={() => {
                    setMessage('');
                    setMode('unlink');
                  }}
                >
                  Hủy liên kết
                </button>
              )}
            </div>
          )}

          {mode === 'email' && (
            <form onSubmit={handleRequest} className="mt-3 max-w-md space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tenban@gmail.com"
                className={inputClass}
                autoComplete="email"
              />
              <div className="flex gap-2">
                <button type="submit" disabled={busy} className={primaryBtn}>
                  {busy && <LoaderCircle size={16} className="animate-spin" />}
                  Gửi mã xác nhận
                </button>
                <button type="button" onClick={reset} className={ghostBtn}>
                  Hủy
                </button>
              </div>
            </form>
          )}

          {mode === 'code' && (
            <form onSubmit={handleVerify} className="mt-3 max-w-md space-y-3">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="Mã 6 chữ số"
                className={`${inputClass} text-center tracking-[0.3em]`}
                autoComplete="one-time-code"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={busy || code.length !== 6}
                  className={primaryBtn}
                >
                  {busy && <LoaderCircle size={16} className="animate-spin" />}
                  Xác nhận
                </button>
                <button type="button" onClick={reset} className={ghostBtn}>
                  Hủy
                </button>
              </div>
            </form>
          )}

          {mode === 'unlink' && (
            <form onSubmit={handleUnlink} className="mt-3 max-w-md space-y-3">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu hiện tại để xác nhận"
                className={inputClass}
                autoComplete="current-password"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={busy || !password}
                  className={primaryBtn}
                >
                  {busy && <LoaderCircle size={16} className="animate-spin" />}
                  Hủy liên kết
                </button>
                <button type="button" onClick={reset} className={ghostBtn}>
                  Quay lại
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default GmailLinkCard;
