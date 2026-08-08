import {
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";
import { useAuth } from "../../context/AuthContext";
import {
  createUserRequest,
  listUsersRequest,
  resetUserPasswordRequest,
  updateUserRequest
} from "../../services/userService";
import "../../styles/userManagement.css";

const ROLE_OPTIONS = [
  { value: "USER", label: "User" },
  { value: "OPERATOR", label: "Operator" },
  { value: "MANAGEMENT", label: "Management" },
  { value: "ADMIN", label: "Administrator" }
];

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Aktif" },
  { value: "INACTIVE", label: "Tidak Aktif" },
  { value: "SUSPENDED", label: "Ditangguhkan" }
];

const EMPTY_CREATE_FORM = {
  username: "",
  email: "",
  fullName: "",
  department: "",
  role: "USER",
  status: "ACTIVE",
  password: "",
  confirmPassword: ""
};

function formatDate(value) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function getRoleLabel(role) {
  return ROLE_OPTIONS.find((item) => item.value === role)?.label || role;
}

function getStatusLabel(status) {
  return STATUS_OPTIONS.find((item) => item.value === status)?.label || status;
}

function validatePassword(password) {
  if (password.length < 12) {
    return "Password minimal 12 karakter.";
  }

  if (!/[a-z]/.test(password)) {
    return "Password harus memiliki huruf kecil.";
  }

  if (!/[A-Z]/.test(password)) {
    return "Password harus memiliki huruf besar.";
  }

  if (!/[0-9]/.test(password)) {
    return "Password harus memiliki angka.";
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    return "Password harus memiliki simbol.";
  }

  return "";
}

function Modal({ title, children, onClose, busy }) {
  return (
    <div className="user-management-modal-backdrop" role="presentation">
      <section
        className="user-management-modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="user-management-modal-header">
          <div>
            <span className="user-management-eyebrow">ADMINISTRATION</span>
            <h2>{title}</h2>
          </div>

          <button
            type="button"
            className="user-management-icon-button"
            onClick={onClose}
            disabled={busy}
            aria-label="Tutup dialog"
          >
            ×
          </button>
        </div>

        {children}
      </section>
    </div>
  );
}

function UserManagement() {
  const {
    user: currentUser,
    authFetch,
    refreshSession
  } = useAuth();

  const [users, setUsers] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    suspended: 0,
    admin: 0
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  });
  const [filters, setFilters] = useState({
    search: "",
    role: "",
    status: ""
  });
  const [appliedSearch, setAppliedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_CREATE_FORM);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [resetUser, setResetUser] = useState(null);
  const [resetForm, setResetForm] = useState({
    password: "",
    confirmPassword: ""
  });

  const loadUsers = useCallback(
    async (page = 1) => {
      setLoading(true);
      setError("");

      try {
        const response = await listUsersRequest(authFetch, {
          search: appliedSearch,
          role: filters.role,
          status: filters.status,
          page,
          limit: pagination.limit
        });

        setUsers(response.data.users);
        setSummary(response.data.summary);
        setPagination(response.data.pagination);
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
      }
    }, [
      authFetch,
      appliedSearch,
      filters.role,
      filters.status,
      pagination.limit
    ]
  );

  useEffect(() => {
    const requestTimer = window.setTimeout(() => {
      loadUsers(1);
    }, 0);

    return () => window.clearTimeout(requestTimer);
  }, [loadUsers]);

  const visibleRange = useMemo(() => {
    if (pagination.total === 0) {
      return "0 pengguna";
    }

    const start = (pagination.page - 1) * pagination.limit + 1;
    const end = Math.min(
      pagination.page * pagination.limit,
      pagination.total
    );

    return `${start}-${end} dari ${pagination.total} pengguna`;
  }, [pagination]);

  const showNotice = (message) => {
    setNotice(message);
    setError("");
    window.setTimeout(() => setNotice(""), 4000);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setAppliedSearch(filters.search.trim());
  };

  const openEdit = (user) => {
    setEditingUser(user);
    setEditForm({
      username: user.username,
      email: user.email,
      fullName: user.fullName || "",
      department: user.department || "",
      role: user.role,
      status: user.status
    });
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    setError("");

    const passwordError = validatePassword(createForm.password);

    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (createForm.password !== createForm.confirmPassword) {
      setError("Konfirmasi password tidak sama.");
      return;
    }

    setWorking(true);

    try {
      await createUserRequest(authFetch, {
        username: createForm.username,
        email: createForm.email,
        fullName: createForm.fullName,
        department: createForm.department,
        role: createForm.role,
        status: createForm.status,
        password: createForm.password
      });

      setCreateOpen(false);
      setCreateForm(EMPTY_CREATE_FORM);
      showNotice("Pengguna berhasil dibuat.");
      await loadUsers(1);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setWorking(false);
    }
  };

  const handleUpdate = async (event) => {
    event.preventDefault();

    if (!editingUser || !editForm) {
      return;
    }

    setWorking(true);
    setError("");

    try {
      const response = await updateUserRequest(
        authFetch,
        editingUser.id,
        editForm
      );

      const updatedCurrentUser = editingUser.id === currentUser?.id;

      if (updatedCurrentUser) {
        await refreshSession();
      }

      setEditingUser(null);
      setEditForm(null);
      showNotice(
        response.data.revokedSessionCount > 0
          ? `Pengguna diperbarui dan ${response.data.revokedSessionCount} session dicabut.`
          : "Pengguna berhasil diperbarui."
      );
      await loadUsers(pagination.page);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setWorking(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();

    if (!resetUser) {
      return;
    }

    const passwordError = validatePassword(resetForm.password);

    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (resetForm.password !== resetForm.confirmPassword) {
      setError("Konfirmasi password tidak sama.");
      return;
    }

    setWorking(true);
    setError("");

    try {
      const response = await resetUserPasswordRequest(
        authFetch,
        resetUser.id,
        resetForm.password
      );

      setResetUser(null);
      setResetForm({ password: "", confirmPassword: "" });
      showNotice(
        `Password berhasil direset. ${response.data.revokedSessionCount} session dicabut.`
      );
      await loadUsers(pagination.page);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="user-management-page">
      <section className="user-management-hero">
        <div>
          <span className="user-management-eyebrow">ACCESS GOVERNANCE</span>
          <h1>User Management</h1>
          <p>
            Kelola akun, role, status, departemen, dan reset password pengguna
            berdasarkan data PostgreSQL.
          </p>
        </div>

        <button
          type="button"
          className="user-management-primary-button"
          onClick={() => {
            setError("");
            setCreateOpen(true);
          }}
        >
          + Tambah Pengguna
        </button>
      </section>

      <section className="user-management-summary-grid">
        <article>
          <span>Total Pengguna</span>
          <strong>{summary.total}</strong>
        </article>
        <article>
          <span>Akun Aktif</span>
          <strong>{summary.active}</strong>
        </article>
        <article>
          <span>Ditangguhkan</span>
          <strong>{summary.suspended}</strong>
        </article>
        <article>
          <span>Administrator</span>
          <strong>{summary.admin}</strong>
        </article>
      </section>

      {notice && (
        <div className="user-management-alert success" role="status">
          {notice}
        </div>
      )}

      {error && (
        <div className="user-management-alert error" role="alert">
          {error}
        </div>
      )}

      <section className="user-management-panel">
        <form
          className="user-management-toolbar"
          onSubmit={handleSearchSubmit}
        >
          <div className="user-management-search-group">
            <input
              type="search"
              value={filters.search}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  search: event.target.value
                }))
              }
              placeholder="Cari username, email, nama, atau departemen"
              aria-label="Cari pengguna"
            />
            <button type="submit">Cari</button>
          </div>

          <select
            value={filters.role}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                role: event.target.value
              }))
            }
            aria-label="Filter role"
          >
            <option value="">Semua Role</option>
            {ROLE_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>

          <select
            value={filters.status}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                status: event.target.value
              }))
            }
            aria-label="Filter status"
          >
            <option value="">Semua Status</option>
            {STATUS_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </form>

        <div className="user-management-table-wrap">
          <table className="user-management-table">
            <thead>
              <tr>
                <th>Pengguna</th>
                <th>Departemen</th>
                <th>Role</th>
                <th>Status</th>
                <th>Dibuat</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="user-management-empty">
                    Memuat data pengguna...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="user-management-empty">
                    Tidak ada pengguna yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const isCurrentUser = user.id === currentUser?.id;

                  return (
                    <tr key={user.id}>
                      <td>
                        <div className="user-management-user-cell">
                          <strong>
                            {user.fullName || user.username}
                            {isCurrentUser && (
                              <span className="user-management-you-badge">
                                Anda
                              </span>
                            )}
                          </strong>
                          <span>@{user.username}</span>
                          <small>{user.email}</small>
                        </div>
                      </td>
                      <td>{user.department || "-"}</td>
                      <td>
                        <span className={`user-management-role ${user.role.toLowerCase()}`}>
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td>
                        <span className={`user-management-status ${user.status.toLowerCase()}`}>
                          {getStatusLabel(user.status)}
                        </span>
                      </td>
                      <td>{formatDate(user.createdAt)}</td>
                      <td>
                        <div className="user-management-actions">
                          <button
                            type="button"
                            onClick={() => openEdit(user)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="secondary"
                            disabled={isCurrentUser}
                            title={
                              isCurrentUser
                                ? "Password akun sendiri diubah melalui menu pengaturan."
                                : "Reset password pengguna"
                            }
                            onClick={() => {
                              setError("");
                              setResetUser(user);
                              setResetForm({
                                password: "",
                                confirmPassword: ""
                              });
                            }}
                          >
                            Reset Password
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="user-management-pagination">
          <span>{visibleRange}</span>
          <div>
            <button
              type="button"
              disabled={pagination.page <= 1 || loading}
              onClick={() => loadUsers(pagination.page - 1)}
            >
              Sebelumnya
            </button>
            <span>
              Halaman {pagination.page} / {pagination.totalPages}
            </span>
            <button
              type="button"
              disabled={
                pagination.page >= pagination.totalPages || loading
              }
              onClick={() => loadUsers(pagination.page + 1)}
            >
              Berikutnya
            </button>
          </div>
        </div>
      </section>

      {createOpen && (
        <Modal
          title="Tambah Pengguna"
          busy={working}
          onClose={() => setCreateOpen(false)}
        >
          {error && (
            <div className="user-management-alert error" role="alert">
              {error}
            </div>
          )}

          <form
            className="user-management-form"
            onSubmit={handleCreate}
          >
            <div className="user-management-form-grid">
              <label>
                Username
                <input
                  required
                  minLength="3"
                  value={createForm.username}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      username: event.target.value
                    }))
                  }
                />
              </label>

              <label>
                Email
                <input
                  required
                  type="email"
                  value={createForm.email}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      email: event.target.value
                    }))
                  }
                />
              </label>

              <label>
                Nama Lengkap
                <input
                  value={createForm.fullName}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      fullName: event.target.value
                    }))
                  }
                />
              </label>

              <label>
                Departemen
                <input
                  value={createForm.department}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      department: event.target.value
                    }))
                  }
                />
              </label>

              <label>
                Role
                <select
                  value={createForm.role}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      role: event.target.value
                    }))
                  }
                >
                  {ROLE_OPTIONS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Status
                <select
                  value={createForm.status}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      status: event.target.value
                    }))
                  }
                >
                  {STATUS_OPTIONS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Password Awal
                <input
                  required
                  type="password"
                  autoComplete="new-password"
                  value={createForm.password}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      password: event.target.value
                    }))
                  }
                />
              </label>

              <label>
                Konfirmasi Password
                <input
                  required
                  type="password"
                  autoComplete="new-password"
                  value={createForm.confirmPassword}
                  onChange={(event) =>
                    setCreateForm((current) => ({
                      ...current,
                      confirmPassword: event.target.value
                    }))
                  }
                />
              </label>
            </div>

            <p className="user-management-password-note">
              Minimal 12 karakter dengan huruf besar, huruf kecil, angka,
              dan simbol.
            </p>

            <div className="user-management-modal-actions">
              <button
                type="button"
                className="secondary"
                onClick={() => setCreateOpen(false)}
                disabled={working}
              >
                Batal
              </button>
              <button type="submit" disabled={working}>
                {working ? "Menyimpan..." : "Simpan Pengguna"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {editingUser && editForm && (
        <Modal
          title={`Edit ${editingUser.username}`}
          busy={working}
          onClose={() => {
            setEditingUser(null);
            setEditForm(null);
          }}
        >
          {error && (
            <div className="user-management-alert error" role="alert">
              {error}
            </div>
          )}

          <form
            className="user-management-form"
            onSubmit={handleUpdate}
          >
            <div className="user-management-form-grid">
              <label>
                Username
                <input
                  required
                  value={editForm.username}
                  onChange={(event) =>
                    setEditForm((current) => ({
                      ...current,
                      username: event.target.value
                    }))
                  }
                />
              </label>

              <label>
                Email
                <input
                  required
                  type="email"
                  value={editForm.email}
                  onChange={(event) =>
                    setEditForm((current) => ({
                      ...current,
                      email: event.target.value
                    }))
                  }
                />
              </label>

              <label>
                Nama Lengkap
                <input
                  value={editForm.fullName}
                  onChange={(event) =>
                    setEditForm((current) => ({
                      ...current,
                      fullName: event.target.value
                    }))
                  }
                />
              </label>

              <label>
                Departemen
                <input
                  value={editForm.department}
                  onChange={(event) =>
                    setEditForm((current) => ({
                      ...current,
                      department: event.target.value
                    }))
                  }
                />
              </label>

              <label>
                Role
                <select
                  value={editForm.role}
                  disabled={editingUser.id === currentUser?.id}
                  onChange={(event) =>
                    setEditForm((current) => ({
                      ...current,
                      role: event.target.value
                    }))
                  }
                >
                  {ROLE_OPTIONS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Status
                <select
                  value={editForm.status}
                  disabled={editingUser.id === currentUser?.id}
                  onChange={(event) =>
                    setEditForm((current) => ({
                      ...current,
                      status: event.target.value
                    }))
                  }
                >
                  {STATUS_OPTIONS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {editingUser.id === currentUser?.id && (
              <p className="user-management-password-note">
                Role dan status akun sendiri dikunci untuk mencegah
                administrator kehilangan akses.
              </p>
            )}

            <div className="user-management-modal-actions">
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  setEditingUser(null);
                  setEditForm(null);
                }}
                disabled={working}
              >
                Batal
              </button>
              <button type="submit" disabled={working}>
                {working ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {resetUser && (
        <Modal
          title={`Reset Password ${resetUser.username}`}
          busy={working}
          onClose={() => setResetUser(null)}
        >
          {error && (
            <div className="user-management-alert error" role="alert">
              {error}
            </div>
          )}

          <form
            className="user-management-form"
            onSubmit={handleResetPassword}
          >
            <p>
              Semua session aktif pengguna ini akan dicabut setelah
              password direset.
            </p>

            <label>
              Password Baru
              <input
                required
                type="password"
                autoComplete="new-password"
                value={resetForm.password}
                onChange={(event) =>
                  setResetForm((current) => ({
                    ...current,
                    password: event.target.value
                  }))
                }
              />
            </label>

            <label>
              Konfirmasi Password Baru
              <input
                required
                type="password"
                autoComplete="new-password"
                value={resetForm.confirmPassword}
                onChange={(event) =>
                  setResetForm((current) => ({
                    ...current,
                    confirmPassword: event.target.value
                  }))
                }
              />
            </label>

            <div className="user-management-modal-actions">
              <button
                type="button"
                className="secondary"
                onClick={() => setResetUser(null)}
                disabled={working}
              >
                Batal
              </button>
              <button type="submit" disabled={working}>
                {working ? "Mereset..." : "Reset Password"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default UserManagement;
