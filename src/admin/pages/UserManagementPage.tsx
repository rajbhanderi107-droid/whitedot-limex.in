import { useCallback, useEffect, useState, type FormEvent } from "react";
import { KeyRound, Plus, RefreshCw } from "lucide-react";
import { api, ApiError } from "../lib/api.js";

type Role = "SUPER_ADMIN" | "ADMIN" | "SALES" | "OPERATIONS" | "VIEWER";

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

const roles: Role[] = ["SUPER_ADMIN", "ADMIN", "SALES", "OPERATIONS", "VIEWER"];

const blankForm = {
  name: "",
  email: "",
  password: "",
  role: "ADMIN" as Role,
};

function formatRole(role: string) {
  return role.toLowerCase().replace("_", " ");
}

function errorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Something went wrong.";
}

export function UserManagementPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [form, setForm] = useState(blankForm);
  const [resetPasswords, setResetPasswords] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const limit = 20;

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search.trim()) params.set("search", search.trim());
      const res = await api.get<UserRow[]>(`/api/users?${params}`);
      setUsers(res.data);
      setTotal(res.pagination?.total ?? res.data.length);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    if (notice || error) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [notice, error]);

  const createUser = async (event: FormEvent) => {
    event.preventDefault();
    setSavingId("new");
    setError("");
    setNotice("");
    try {
      await api.post<UserRow>("/api/users", form);
      setForm(blankForm);
      setSearch("");
      setPage(1);
      setNotice("User created.");
      await loadUsers();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSavingId(null);
    }
  };

  const updateUser = async (id: string, body: Partial<UserRow> & { password?: string }): Promise<boolean> => {
    setSavingId(id);
    setError("");
    setNotice("");
    try {
      const res = await api.patch<UserRow>(`/api/users/${id}`, body);
      setUsers((current) => current.map((user) => (user.id === id ? { ...user, ...res.data } : user)));
      setNotice("User updated.");
      return true;
    } catch (err) {
      setError(errorMessage(err));
      return false;
    } finally {
      setSavingId(null);
    }
  };

  const resetPassword = async (user: UserRow) => {
    const password = resetPasswords[user.id]?.trim();
    if (!password) {
      setError("Enter a new password first.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    const success = await updateUser(user.id, { password });
    if (success) {
      setResetPasswords((current) => ({ ...current, [user.id]: "" }));
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <>
      <div className="adm-header">
        <h1>Users</h1>
        <p>Create admin users, assign roles, and control dashboard access.</p>
      </div>

      {(notice || error) && (
        <div className={`adm-alert ${error ? "adm-alert-error" : "adm-alert-success"}`}>
          {error || notice}
        </div>
      )}

      <form className="adm-panel adm-user-create" onSubmit={createUser}>
        <div className="adm-panel-head">
          <div>
            <h2>Create user</h2>
            <p>Only super admins can add dashboard users.</p>
          </div>
          <button className="adm-btn adm-btn-primary" type="submit" disabled={savingId === "new"}>
            <Plus size={16} />
            {savingId === "new" ? "Creating..." : "Create user"}
          </button>
        </div>
        <div className="adm-form-grid">
          <label className="adm-form-group">
            <span>Name</span>
            <input
              className="adm-input"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              required
            />
          </label>
          <label className="adm-form-group">
            <span>Email</span>
            <input
              className="adm-input"
              type="email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              required
            />
          </label>
          <label className="adm-form-group">
            <span>Password</span>
            <input
              className="adm-input"
              type="password"
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              minLength={8}
              required
            />
          </label>
          <label className="adm-form-group">
            <span>Role</span>
            <select
              className="adm-input"
              value={form.role}
              onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as Role }))}
            >
              {roles.map((role) => (
                <option value={role} key={role}>{formatRole(role)}</option>
              ))}
            </select>
          </label>
        </div>
      </form>

      <div className="adm-table-wrap">
        <div className="adm-toolbar">
          <input
            className="adm-search"
            placeholder="Search users..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
          <button className="adm-btn adm-btn-ghost" type="button" onClick={loadUsers}>
            <RefreshCw size={15} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div style={{ padding: "1rem" }}>
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className="adm-skeleton adm-skeleton-row" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="adm-empty">No users found.</div>
        ) : (
          <div className="adm-table-scroll">
            <table className="adm-table adm-users-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Password</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <strong>{user.name}</strong>
                      <span className="adm-muted-line">{user.email}</span>
                    </td>
                    <td>
                      <select
                        className="adm-input adm-input-compact"
                        value={user.role}
                        disabled={savingId === user.id}
                        onChange={(event) => updateUser(user.id, { role: event.target.value as Role })}
                      >
                        {roles.map((role) => (
                          <option value={role} key={role}>{formatRole(role)}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <label className="adm-switch">
                        <input
                          type="checkbox"
                          checked={user.isActive}
                          disabled={savingId === user.id}
                          onChange={(event) => updateUser(user.id, { isActive: event.target.checked })}
                        />
                        <span>{user.isActive ? "Active" : "Inactive"}</span>
                      </label>
                    </td>
                    <td>
                      <div className="adm-inline-edit">
                        <input
                          className="adm-input adm-input-compact"
                          type="password"
                          minLength={8}
                          placeholder="New password"
                          value={resetPasswords[user.id] ?? ""}
                          onChange={(event) =>
                            setResetPasswords((current) => ({ ...current, [user.id]: event.target.value }))
                          }
                        />
                        <button
                          className="adm-icon-btn"
                          type="button"
                          title="Set password"
                          disabled={savingId === user.id || !(resetPasswords[user.id]?.trim())}
                          onClick={() => resetPassword(user)}
                        >
                          <KeyRound size={15} />
                        </button>
                      </div>
                    </td>
                    <td>
                      <span style={{ color: "var(--adm-muted)" }}>
                        {new Date(user.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="adm-pagination">
            <span>Page {page} of {totalPages}</span>
            <div className="adm-pagination-btns">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button>
              <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
