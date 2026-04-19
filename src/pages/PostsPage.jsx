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

function truncateText(text, maxLength = 120) {
  if (!text) return "—";
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

export default function PostsPage() {
  const [posts, setPosts] = useState([]);
  const [meta, setMeta] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState(null);

  async function fetchPosts(page = 1, searchValue = "") {
    try {
      setIsLoading(true);
      setError("");

      const { data } = await api.get("/api/admin/posts", {
        params: {
          page,
          search: searchValue,
        },
      });

      setPosts(data.data ?? []);
      setMeta(data);
    } catch (err) {
      console.error("Erreur chargement posts :", err);
      setError("Impossible de charger les posts.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchPosts();
  }, []);

  function handleSearch(e) {
    const value = e.target.value;
    setSearch(value);
    fetchPosts(1, value);
  }

  async function handleDeletePost(postId) {
    const confirmed = window.confirm("Supprimer ce post ?");

    if (!confirmed) return;

    try {
      setActionLoadingId(postId);
      await api.delete(`/api/admin/posts/${postId}`);
      await fetchPosts(meta?.current_page || 1, search);
    } catch (err) {
      console.error("Erreur suppression post :", err);
      alert(
        err.response?.data?.message || "Impossible de supprimer ce post."
      );
    } finally {
      setActionLoadingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[var(--text-main)]">Posts</h1>
        <p className="mt-2 text-[var(--text-secondary)]">
          Gestion des publications de la plateforme.
        </p>
      </div>

      <div className="flex items-center gap-4">
        <input
          type="text"
          placeholder="Rechercher dans le contenu d’un post..."
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
              <th className="px-6 py-4">Auteur</th>
              <th className="px-6 py-4">Contenu</th>
              <th className="px-6 py-4">Créé le</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              <tr>
                <td
                  colSpan="5"
                  className="px-6 py-6 text-center text-[var(--text-secondary)]"
                >
                  Chargement...
                </td>
              </tr>
            ) : posts.length === 0 ? (
              <tr>
                <td
                  colSpan="5"
                  className="px-6 py-6 text-center text-[var(--text-secondary)]"
                >
                  Aucun post trouvé.
                </td>
              </tr>
            ) : (
              posts.map((post) => (
                <tr
                  key={post.id}
                  className="border-t border-[var(--border-color)]"
                >
                  <td className="px-6 py-4 text-[var(--text-main)]">
                    {post.id}
                  </td>
                  <td className="px-6 py-4 text-[var(--text-main)]">
                    {post.user?.name ?? "Utilisateur inconnu"}
                  </td>
                  <td className="px-6 py-4 text-[var(--text-main)]">
                    {truncateText(post.content)}
                  </td>
                  <td className="px-6 py-4 text-[var(--text-secondary)]">
                    {formatDate(post.created_at)}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      disabled={actionLoadingId === post.id}
                      className="rounded-xl bg-red-500/15 px-3 py-2 text-xs font-medium text-red-300 transition hover:bg-red-500/25 disabled:opacity-50"
                    >
                      Supprimer
                    </button>
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
            onClick={() => fetchPosts(meta.current_page - 1, search)}
            className="rounded-xl border border-[var(--border-color)] px-4 py-2 text-[var(--text-main)] disabled:opacity-50"
          >
            Précédent
          </button>

          <span className="text-sm text-[var(--text-secondary)]">
            Page {meta.current_page} / {meta.last_page}
          </span>

          <button
            disabled={meta.current_page === meta.last_page}
            onClick={() => fetchPosts(meta.current_page + 1, search)}
            className="rounded-xl border border-[var(--border-color)] px-4 py-2 text-[var(--text-main)] disabled:opacity-50"
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
}