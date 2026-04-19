import { useEffect, useState } from "react";
import { Pencil, Trash2, X } from "lucide-react";
import api from "../services/api";

export default function GenresPage() {
  const [genres, setGenres] = useState([]);
  const [meta, setMeta] = useState(null);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGenre, setEditingGenre] = useState(null);

  const [form, setForm] = useState({
    name: "",
  });

  async function fetchGenres(currentPage = 1, currentSearch = search) {
    setIsLoading(true);
    setError("");

    try {
      const response = await api.get("/api/admin/genres", {
        params: {
          page: currentPage,
          search: currentSearch,
        },
      });

      setGenres(response.data.data ?? []);
      setMeta({
        current_page: response.data.current_page,
        last_page: response.data.last_page,
        total: response.data.total,
      });
    } catch (err) {
      console.error(err);
      setError("Impossible de charger les genres.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchGenres(page, search);
  }, [page]);

  function resetForm() {
    setForm({ name: "" });
    setEditingGenre(null);
    setIsFormOpen(false);
  }

  function openCreateForm() {
    setError("");
    setSuccess("");
    resetForm();
    setIsFormOpen(true);
  }

  function openEditForm(genre) {
    setError("");
    setSuccess("");
    setEditingGenre(genre);
    setForm({ name: genre.name });
    setIsFormOpen(true);
  }

  function handleChange(e) {
    setForm({ ...form, name: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();
      formData.append("name", form.name);

      if (editingGenre) {
        formData.append("_method", "PUT");

        const res = await api.post(
          `/api/admin/genres/${editingGenre.id}`,
          formData
        );

        setSuccess(res.data.message || "Genre mis à jour.");
      } else {
        const res = await api.post("/api/admin/genres", formData);
        setSuccess(res.data.message || "Genre créé.");
      }

      resetForm();
      fetchGenres(page, search);
    } catch (err) {
      console.error(err);

      const message =
        err.response?.data?.message ||
        Object.values(err.response?.data?.errors || {})?.flat()?.[0] ||
        "Erreur.";

      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(genre) {
    if (!confirm(`Supprimer "${genre.name}" ?`)) return;

    try {
      const res = await api.delete(`/api/admin/genres/${genre.id}`);
      setSuccess(res.data.message || "Genre supprimé.");

      const nextPage = genres.length === 1 && page > 1 ? page - 1 : page;
      setPage(nextPage);

      if (nextPage === page) {
        fetchGenres(nextPage, search);
      }
    } catch (err) {
      console.error(err);
      setError("Impossible de supprimer.");
    }
  }

  function handleSearch(e) {
    e.preventDefault();
    setPage(1);
    fetchGenres(1, search);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[var(--text-main)]">
          Genres
        </h1>
        <p className="mt-2 text-[var(--text-secondary)]">
          Gestion des genres de jeux.
        </p>
      </div>

      {(error || success) && (
        <div className="space-y-2">
          {error && <div className="text-red-400">{error}</div>}
          {success && <div className="text-green-400">{success}</div>}
        </div>
      )}

      <div className="rounded-3xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:justify-between">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="rounded-xl border px-3 py-2"
            />
            <button className="px-3 py-2 border rounded-xl">
              OK
            </button>
          </form>

          <button
            onClick={openCreateForm}
            className="rounded-xl bg-[var(--primary)] px-4 py-2 text-white"
          >
            Ajouter
          </button>
        </div>

        {isFormOpen && (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <input
              value={form.name}
              onChange={handleChange}
              placeholder="Nom du genre"
              className="w-full rounded-xl border px-3 py-2"
              required
            />

            <div className="flex gap-2">
              <button className="bg-[var(--primary)] text-white px-4 py-2 rounded-xl">
                {editingGenre ? "Update" : "Créer"}
              </button>

              <button
                type="button"
                onClick={resetForm}
                className="border px-4 py-2 rounded-xl"
              >
                Annuler
              </button>
            </div>
          </form>
        )}

        <div className="mt-6">
          {isLoading ? (
            <p>Chargement...</p>
          ) : genres.length === 0 ? (
            <p>Aucun genre</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-left">
                  <th>Nom</th>
                  <th>Slug</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {genres.map((g) => (
                  <tr key={g.id}>
                    <td>{g.name}</td>
                    <td>{g.slug}</td>
                    <td className="flex gap-2">
                      <button onClick={() => openEditForm(g)}>
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => handleDelete(g)}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {meta && meta.last_page > 1 && (
          <div className="mt-4 flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Prev
            </button>

            <span>
              {meta.current_page} / {meta.last_page}
            </span>

            <button
              disabled={page === meta.last_page}
              onClick={() => setPage(page + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}