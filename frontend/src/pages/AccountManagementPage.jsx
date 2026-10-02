import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  KeyRound,
  LoaderCircle,
  Plus,
  Send,
  Shield,
  Trash2,
  UserRound,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { getDepartments } from '../api/departmentApi';
import {
  getUsers,
  createUser,
  updateUserPassword,
  deleteUser,
} from '../api/userApi';

import { sendAdminNotification } from '../api/notificationApi';

function AccountManagementPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [showSendNotification, setShowSendNotification] = useState(false);
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [selectedRecipientIds, setSelectedRecipientIds] = useState([]);
  const [notificationSuccess, setNotificationSuccess] = useState('');

  const [selectedUser, setSelectedUser] = useState(null);

  const [createForm, setCreateForm] = useState({
    full_name: '',
    username: '',
    password: '',
    role: 'HEAD',
    department_id: '',
  });

  const [newPassword, setNewPassword] = useState('');

  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      const [usersResult, departmentsResult] = await Promise.all([
        getUsers(),
        getDepartments(),
      ]);

      if (usersResult.success) {
        setUsers(usersResult.data);
      } else {
        setError(usersResult.message || 'Không thể tải danh sách tài khoản.');
      }

      if (departmentsResult.success) {
        setDepartments(departmentsResult.data);
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

  const handleRecipientChange = (userId, checked) => {
    setSelectedRecipientIds((prev) =>
      checked
        ? [...prev, userId]
        : prev.filter((id) => id !== userId)
    );
  };

  const handleSelectAllRecipients = (checked) => {
    setSelectedRecipientIds(
      checked ? users.map((account) => account.user_id) : []
    );
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();
    setActionError('');
    setNotificationSuccess('');

    const title = notificationTitle.trim();
    const message = notificationMessage.trim();

    if (!title || !message) {
      setActionError('Vui lòng nhập tiêu đề và nội dung thông báo.');
      return;
    }

    if (title.length > 200) {
      setActionError('Tiêu đề không được vượt quá 200 ký tự.');
      return;
    }

    if (message.length > 500) {
      setActionError('Nội dung không được vượt quá 500 ký tự.');
      return;
    }

    if (selectedRecipientIds.length === 0) {
      setActionError('Vui lòng chọn ít nhất một người nhận.');
      return;
    }

    try {
      setActionLoading(true);

      const result = await sendAdminNotification({
        title,
        message,
        recipient_ids: selectedRecipientIds,
      });

      if (!result.success) {
        setActionError(result.message || 'Không thể gửi thông báo.');
        return;
      }

      setShowSendNotification(false);
      setNotificationTitle('');
      setNotificationMessage('');
      setSelectedRecipientIds([]);
      setNotificationSuccess('Đã gửi thông báo thành công.');
    } catch (err) {
      setActionError(
        err.response?.data?.message || 'Không thể gửi thông báo.'
      );
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateChange = (e) => {
    const { name, value } = e.target;

    setCreateForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRoleChange = (e) => {
    const role = e.target.value;

    setCreateForm((prev) => ({
      ...prev,
      role,
      department_id: role === 'HEAD' ? prev.department_id : '',
    }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    setActionError('');

    if (!createForm.full_name || !createForm.username || !createForm.password) {
      setActionError('Vui lòng nhập đầy đủ thông tin bắt buộc.');
      return;
    }

    if (createForm.password.length < 6) {
      setActionError('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }

    if (
      createForm.role === 'HEAD' &&
      !createForm.department_id
    ) {
      setActionError('Vui lòng chọn ban cho tài khoản HEAD.');
      return;
    }

    try {
      setActionLoading(true);

      const result = await createUser({
        full_name: createForm.full_name,
        username: createForm.username,
        password: createForm.password,
        role: createForm.role,
        department_id:
          createForm.role === 'HEAD'
            ? Number(createForm.department_id)
            : null,
      });

      if (!result.success) {
        setActionError(
          result.message || 'Không thể tạo tài khoản.'
        );
        return;
      }

      setShowCreate(false);

      setCreateForm({
        full_name: '',
        username: '',
        password: '',
        role: 'HEAD',
        department_id: '',
      });

      await loadData();
    } catch (err) {
      setActionError(
        err.response?.data?.message ||
        'Không thể tạo tài khoản.'
      );
    } finally {
      setActionLoading(false);
    }
  };

  const openPasswordModal = (targetUser) => {
    setSelectedUser(targetUser);
    setNewPassword('');
    setActionError('');
    setShowPassword(true);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    setActionError('');

    if (!newPassword) {
      setActionError('Vui lòng nhập mật khẩu mới.');
      return;
    }

    if (newPassword.length < 6) {
      setActionError('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }

    try {
      setActionLoading(true);

      const result = await updateUserPassword(
        selectedUser.user_id,
        newPassword
      );

      if (!result.success) {
        setActionError(
          result.message || 'Không thể thay đổi mật khẩu.'
        );
        return;
      }

      setShowPassword(false);
      setSelectedUser(null);
      setNewPassword('');
    } catch (err) {
      setActionError(
        err.response?.data?.message ||
        'Không thể thay đổi mật khẩu.'
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (targetUser) => {
    if (targetUser.user_id === user.user_id) {
      setError('Không thể xóa chính tài khoản đang đăng nhập.');
      return;
    }

    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa tài khoản "${targetUser.username}" không?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError('');

      const result = await deleteUser(targetUser.user_id);

      if (!result.success) {
        setError(
          result.message || 'Không thể xóa tài khoản.'
        );
        return;
      }

      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Không thể xóa tài khoản.'
      );
    }
  };

  if (user?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="mx-auto max-w-4xl rounded-2xl bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-gray-800">
            Không có quyền truy cập
          </h1>

          <p className="mt-2 text-gray-500">
            Chỉ ADMIN mới có quyền quản lý tài khoản.
          </p>

          <button
            onClick={() => navigate('/dashboard')}
            className="mt-6 rounded-lg bg-gray-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-700"
          >
            Quay lại Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition hover:bg-gray-100"
            >
              <ArrowLeft size={20} />
            </button>

            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Quản lý tài khoản
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Quản lý tài khoản ADMIN và HEAD trong hệ thống
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              onClick={() => {
                setActionError('');
                setNotificationSuccess('');
                setSelectedRecipientIds([]);
                setShowSendNotification(true);
              }}
              className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <Send size={18} />
              Gửi thông báo
            </button>

            <button
              onClick={() => {
                setActionError('');
                setShowCreate(true);
              }}
              className="flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-600"
            >
              <Plus size={19} />
              Tạo tài khoản
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {notificationSuccess && (
  <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
    {notificationSuccess}
  </div>
)}

        {/* Account table */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-4">
            <h2 className="font-semibold text-gray-800">
              Danh sách tài khoản
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Tổng số: {users.length} tài khoản
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-gray-500">
              <LoaderCircle
                size={20}
                className="animate-spin"
              />
              Đang tải danh sách tài khoản...
            </div>
          ) : users.length === 0 ? (
            <div className="py-16 text-center text-gray-500">
              Chưa có tài khoản nào.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left">
                <thead className="bg-gray-50 text-sm text-gray-600">
                  <tr>
                    <th className="px-5 py-4 font-semibold">
                      Người dùng
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Username
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Vai trò
                    </th>

                    <th className="px-5 py-4 font-semibold">
                      Ban
                    </th>

                    <th className="px-5 py-4 text-right font-semibold">
                      Thao tác
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {users.map((account) => (
                    <tr
                      key={account.user_id}
                      className="transition hover:bg-gray-50"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                            <UserRound size={19} />
                          </div>

                          <div>
                            <p className="font-medium text-gray-800">
                              {account.full_name}
                            </p>

                            {account.user_id === user.user_id && (
                              <span className="text-xs text-green-600">
                                Tài khoản hiện tại
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-sm text-gray-600">
                        {account.username}
                      </td>

                      <td className="px-5 py-4">
                        <span
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                          account.role === 'ADMIN'
                            ? 'bg-red-100 text-red-700'
                            : account.role === 'HEAD'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-green-100 text-green-700'
                        }`}
                        >
                          <Shield size={13} />
                          {account.role}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm text-gray-600">
                        {account.role === 'GUEST'
                          ? 'Không thuộc Ban'
                          : account.department_name || 'Toàn hệ thống'}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openPasswordModal(account)}
                            className="flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 transition hover:bg-blue-100"
                          >
                            <KeyRound size={15} />
                            Đổi mật khẩu
                          </button>

                          {account.user_id !== user.user_id && (
                            <button
                              onClick={() => handleDelete(account)}
                              className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 transition hover:bg-red-100"
                            >
                              <Trash2 size={15} />
                              Xóa
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
        </div>
      </div>

      {/* Create account modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  Tạo tài khoản
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Thêm tài khoản ADMIN, HEAD hoặc GUEST
                </p>
              </div>

              <button
                onClick={() => setShowCreate(false)}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleCreate}
              className="space-y-4 p-6"
            >
              {actionError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {actionError}
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Họ và tên
                </label>

                <input
                  name="full_name"
                  value={createForm.full_name}
                  onChange={handleCreateChange}
                  placeholder="Nhập họ và tên"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Tên đăng nhập
                </label>

                <input
                  name="username"
                  value={createForm.username}
                  onChange={handleCreateChange}
                  placeholder="Nhập username"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Mật khẩu
                </label>

                <input
                  type="password"
                  name="password"
                  value={createForm.password}
                  onChange={handleCreateChange}
                  placeholder="Tối thiểu 6 ký tự"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Vai trò
                </label>

                <select
                  value={createForm.role}
                  onChange={handleRoleChange}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                >
                  <option value="ADMIN">ADMIN</option>
                  <option value="HEAD">HEAD</option>
                  <option value="GUEST">GUEST</option>
                  
                </select>
              </div>

              {createForm.role === 'HEAD' && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Ban
                  </label>

                  <select
                    name="department_id"
                    value={createForm.department_id}
                    onChange={handleCreateChange}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                  >
                    <option value="">
                      -- Chọn ban --
                    </option>

                    {departments.map((department) => (
                      <option
                        key={department.department_id}
                        value={department.department_id}
                      >
                        {department.department_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex items-center gap-2 rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {actionLoading && (
                    <LoaderCircle
                      size={17}
                      className="animate-spin"
                    />
                  )}

                  Tạo tài khoản
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset password modal */}
      {showPassword && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  Đổi mật khẩu
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Tài khoản: {selectedUser.username}
                </p>
              </div>

              <button
                onClick={() => setShowPassword(false)}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleResetPassword}
              className="space-y-4 p-6"
            >
              {actionError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {actionError}
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Mật khẩu mới
                </label>

                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowPassword(false)}
                  className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {actionLoading && (
                    <LoaderCircle
                      size={17}
                      className="animate-spin"
                    />
                  )}

                  Lưu mật khẩu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    {/* Send notification modal */}
    {showSendNotification && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <div>
              <h2 className="text-lg font-bold text-gray-800">
                Gửi thông báo
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Soạn nội dung và chọn tài khoản nhận thông báo.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowSendNotification(false)}
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSendNotification} className="space-y-5 p-6">
            {actionError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {actionError}
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Tiêu đề
              </label>
              <input
                value={notificationTitle}
                onChange={(e) => setNotificationTitle(e.target.value)}
                maxLength={200}
                placeholder="Nhập tiêu đề thông báo"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              <p className="mt-1 text-right text-xs text-gray-400">
                {notificationTitle.length}/200
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Nội dung
              </label>
              <textarea
                value={notificationMessage}
                onChange={(e) => setNotificationMessage(e.target.value)}
                maxLength={500}
                rows={4}
                placeholder="Nhập nội dung thông báo"
                className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              <p className="mt-1 text-right text-xs text-gray-400">
                {notificationMessage.length}/500
              </p>
            </div>

            <div>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Người nhận ({selectedRecipientIds.length}/{users.length})
                </label>

                <label className="flex items-center gap-2 text-sm text-blue-700">
                  <input
                    type="checkbox"
                    checked={
                      users.length > 0 &&
                      selectedRecipientIds.length === users.length
                    }
                    onChange={(e) =>
                      handleSelectAllRecipients(e.target.checked)
                    }
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  Chọn tất cả
                </label>
              </div>

              <div className="max-h-56 space-y-2 overflow-y-auto rounded-lg border border-gray-200 p-3">
                {users.map((account) => (
                  <label
                    key={account.user_id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedRecipientIds.includes(account.user_id)}
                      onChange={(e) =>
                        handleRecipientChange(
                          account.user_id,
                          e.target.checked
                        )
                      }
                      className="h-4 w-4 rounded border-gray-300"
                    />

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-800">
                        {account.full_name}
                      </p>
                      <p className="truncate text-xs text-gray-500">
                        {account.username} · {account.role}
                        {account.department_name
                          ? ` · ${account.department_name}`
                          : ''}
                      </p>
                    </div>
                  </label>
                ))}

                {users.length === 0 && (
                  <p className="py-4 text-center text-sm text-gray-500">
                    Không có tài khoản để chọn.
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSendNotification(false)}
                className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Hủy
              </button>

              <button
                type="submit"
                disabled={actionLoading || selectedRecipientIds.length === 0}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {actionLoading && (
                  <LoaderCircle size={17} className="animate-spin" />
                )}
                Gửi thông báo
              </button>
            </div>
          </form>
        </div>
      </div>
    )}

    </div>
  );
}

export default AccountManagementPage;