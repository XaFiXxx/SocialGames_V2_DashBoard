import { useEffect, useState } from "react";
import api from "../services/api";

function formatDate(dateString) {
  if (!dateString) return "-";

  try {
    return new Date(dateString).toLocaleDateString("fr-BE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "-";
  }
}

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState(null);

  async function fetchUsers(page = 1, searchValue = "") {
    try {
      setIsLoading(true);
      setError("");

      const { data } = await api.get("/api/admin/users", {
        params: {
          page,
          search: searchValue,
        },
      });

      setUsers(data.data ?? []);
      setMeta(data);
    } catch (err) {
      console.error("Erreur chargement users :", err);
      setError("Impossible de charger les utilisateurs.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  function handleSearch(e) {
    const value = e.target.value;
    setSearch(value);
    fetchUsers(1, value);
  }

  async function handleToggleAdmin(userId) {
    try {
      setActionLoadingId(userId);
      await api.patch(`/api/admin/users/${userId}/toggle-admin`);
      await fetchUsers(meta?.current_page || 1, search);
    } catch (err) {
      console.error("Erreur changement rôle admin :", err);
      alert(
        err.response?.data?.message ||
          "Impossible de modifier le statut admin."
      );
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleDeleteUser(userId, userName) {
    const confirmed = window.confirm(
      `Supprimer l'utilisateur "${userName}" ?`
    );

    if (!confirmed) return;

    try {
      setActionLoadingId(userId);
      await api.delete(`/api/admin/users/${userId}`);
      await fetchUsers(meta?.current_page || 1, search);
    } catch (err) {
      console.error("Erreur suppression user :", err);
      alert(
        err.response?.data?.message ||
          "Impossible de supprimer cet utilisateur."
      );
    } finally {
      setActionLoadingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[var(--text-main)]">
          Utilisateurs
        </h1>
        <p className="mt-2 text-[var(--text-secondary)]">
          Gestion des comptes de la plateforme.
        </p>
      </div>

      <div className="flex items-center gap-4">
        <input
          type="text"
          placeholder="Rechercher par nom ou email..."
          value={search}
          onChange={handleSearch}
          className="w-full max-w-md rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] px-4 py-3 text-sm text-[var(--text-main)] outline-none focus:border-[var(--primary)]"
        />
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-3xl border border-[var(--border-color)] bg-[var(--bg-card)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--bg-secondary)] text-left text-[var(--text-secondary)]">
            <tr>
              <th className="px-6 py-4">ID</th>
              <th className="px-6 py-4">Nom</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Admin</th>
              <th className="px-6 py-4">Créé le</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              <tr>
                <td
                  colSpan="6"
                  className="px-6 py-6 text-center text-[var(--text-secondary)]"
                >
                  Chargement...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td
                  colSpan="6"
                  className="px-6 py-6 text-center text-[var(--text-secondary)]"
                >
                  Aucun utilisateur trouvé.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr
                  key={user.id}
                  className="border-t border-[var(--border-color)]"
                >
                  <td className="px-6 py-4 text-[var(--text-main)]">
                    {user.id}
                  </td>
                  <td className="px-6 py-4 text-[var(--text-main)]">
                    {user.name}
                  </td>
                  <td className="px-6 py-4 text-[var(--text-main)]">
                    {user.email}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        user.is_admin
                          ? "bg-green-500/15 text-green-300"
                          : "bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
                      }`}
                    >
                      {user.is_admin ? "Oui" : "Non"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[var(--text-secondary)]">
                    {formatDate(user.created_at)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleToggleAdmin(user.id)}
                        disabled={actionLoadingId === user.id}
                        className="rounded-xl border border-[var(--border-color)] px-3 py-2 text-xs font-medium text-[var(--text-main)] transition hover:bg-[var(--bg-secondary)] disabled:opacity-50"
                      >
                        {user.is_admin ? "Retirer admin" : "Passer admin"}
                      </button>

                      <button
                        onClick={() => handleDeleteUser(user.id, user.name)}
                        disabled={actionLoadingId === user.id}
                        className="rounded-xl bg-red-500/15 px-3 py-2 text-xs font-medium text-red-300 transition hover:bg-red-500/25 disabled:opacity-50"
                      >
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {meta && meta.last_page > 1 && (
        <div className="flex items-center justify-between">
          <button
            disabled={meta.current_page === 1}
            onClick={() => fetchUsers(meta.current_page - 1, search)}
            className="rounded-xl border border-[var(--border-color)] px-4 py-2 text-[var(--text-main)] disabled:opacity-50"
          >
            Précédent
          </button>

          <span className="text-sm text-[var(--text-secondary)]">
            Page {meta.current_page} / {meta.last_page}
          </span>

          <button
            disabled={meta.current_page === meta.last_page}
            onClick={() => fetchUsers(meta.current_page + 1, search)}
            className="rounded-xl border border-[var(--border-color)] px-4 py-2 text-[var(--text-main)] disabled:opacity-50"
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
}