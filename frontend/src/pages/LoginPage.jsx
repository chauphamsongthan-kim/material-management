import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/authApi';
import { useAuth } from '../context/AuthContext';

function LoginPage() {
  const { loginUser } = useAuth();

  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');

    if (!username || !password) {
      setError('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
      return;
    }

    try {
      setLoading(true);

      const result = await login(username, password);

      if (result.success) {
        loginUser(result.data.user, result.data.token);

        navigate('/dashboard');
      } else {
        setError(result.message || 'Đăng nhập thất bại.');
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Không thể kết nối đến máy chủ.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#171717]">

{/* White background image */}
<div
  className="absolute inset-0 scale-110 bg-cover bg-center bg-no-repeat blur-md"
  style={{
    backgroundImage: "url('/background-white.webp')",
  }}
/>

{/* Blurred logo */}
<div
  className="absolute inset-0 bg-[length:70%_auto] bg-center bg-no-repeat blur-lg"
  style={{
    backgroundImage: "url('/logo-chua-hoi-duc.png')",
  }}
/>

{/* Dark overlay */}
<div className="absolute inset-0 bg-black/55" />

      {/* Login content */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8">

        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-2xl backdrop-blur-sm sm:p-10">

          {/* Header */}
          <div className="mb-8 text-center">

            <h1 className="text-3xl font-bold tracking-tight text-gray-800 sm:text-4xl">
              Quản lý thiết bị
            </h1>

            <p className="mt-3 text-lg text-gray-500">
              Chùa Hội Đức
            </p>

            <div className="mx-auto mt-5 h-1 w-20 rounded-full bg-amber-500" />

          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>

            {/* Username */}
            <div className="mb-5">

              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Tên đăng nhập
              </label>

              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                placeholder="Nhập tên đăng nhập"
              />

            </div>

            {/* Password */}
            <div className="mb-7">

              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Mật khẩu
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                placeholder="Nhập mật khẩu"
              />

            </div>

            {/* Login button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-amber-500 py-3 font-bold text-white shadow-lg shadow-amber-500/20 transition hover:bg-amber-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>

          </form>

        </div>
      </div>
    </div>
  );
}

export default LoginPage;