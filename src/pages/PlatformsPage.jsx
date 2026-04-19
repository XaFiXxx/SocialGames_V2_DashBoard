import { useEffect, useMemo, useState } from "react";
import { ImagePlus, Pencil, Trash2, X } from "lucide-react";
import api from "../services/api";

function getImageUrl(path) {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${import.meta.env.VITE_API_URL}/${path}`;
}

export default function PlatformsPage() {
  const [platforms, setPlatforms] = useState([]);
  const [meta, setMeta] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPlatform, setEditingPlatform] = useState(null);

  const [form, setForm] = useState({
    name: "",
    logo: null,
  });

  const [previewUrl, setPreviewUrl] = useState(null);

  async function fetchPlatforms(currentPage = 1, currentSearch = search) {
    setIsLoading(true);
    setError("");

    try {
      const response = await api.get("/api/admin/platforms", {
        params: {
          page: currentPage,
          search: currentSearch,
        },
      });

      setPlatforms(response.data.data ?? []);
      setMeta({
        current_page: response.data.current_page,
        last_page: response.data.last_page,
        per_page: response.data.per_page,
        total: response.data.total,
      });
    } catch (err) {
      console.error(err);
      setError("Impossible de charger les plateformes.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchPlatforms(page, search);
  }, [page]);

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const previewImage = useMemo(() => {
    if (previewUrl) return previewUrl;
    if (editingPlatform?.logo) {
      const url = getImageUrl(editingPlatform.logo);
      const separator = url.includes("?") ? "&" : "?";
      return `${url}${separator}t=${editingPlatform.updated_at ?? Date.now()}`;
    }
    return null;
  }, [previewUrl, editingPlatform]);

  function resetForm() {
    if (previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }

    setForm({
      name: "",
      logo: null,
    });
    setPreviewUrl(null);
    setEditingPlatform(null);
    setIsFormOpen(false);
  }

  function openCreateForm() {
    setError("");
    setSuccess("");
    resetForm();
    setIsFormOpen(true);
  }

  function openEditForm(platform) {
    if (previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }

    setError("");
    setSuccess("");
    setEditingPlatform(platform);
    setForm({
      name: platform.name ?? "",
      logo: null,
    });
    setPreviewUrl(null);
    setIsFormOpen(true);
  }

  function handleChange(event) {
    const { name, value, files } = event.target;

    if (name === "logo") {
      const file = files?.[0] ?? null;

      if (previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }

      setForm((prev) => ({
        ...prev,
        logo: file,
      }));

      setPreviewUrl(file ? URL.createObjectURL(file) : null);
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();
      formData.append("name", form.name);

      if (form.logo) {
        formData.append("logo", form.logo);
      }

      if (editingPlatform) {
        formData.append("_method", "PUT");

        const response = await api.post(
          `/api/admin/platforms/${editingPlatform.id}`,
          formData
        );

        setSuccess(response.data.message || "Plateforme mise à jour.");
      } else {
        const response = await api.post("/api/admin/platforms", formData);
        setSuccess(response.data.message || "Plateforme créée avec succès.");
      }

      resetForm();
      fetchPlatforms(page, search);
    } catch (err) {
      console.error(err);

      const message =
        err.response?.data?.message ||
        Object.values(err.response?.data?.errors || {})?.flat()?.[0] ||
        "Une erreur est survenue.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(platform) {
    const confirmed = window.confirm(
      `Supprimer la plateforme "${platform.name}" ?`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      const response = await api.delete(`/api/admin/platforms/${platform.id}`);
      setSuccess(response.data.message || "Plateforme supprimée.");

      const shouldGoPreviousPage =
        platforms.length === 1 && page > 1;

      const nextPage = shouldGoPreviousPage ? page - 1 : page;
      setPage(nextPage);

      if (!shouldGoPreviousPage) {
        fetchPlatforms(nextPage, search);
      }
    } catch (err) {
      console.error(err);
      setError("Impossible de supprimer la plateforme.");
    }
  }

  function handleSearchSubmit(event) {
    event.preventDefault();
    setPage(1);
    fetchPlatforms(1, search);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[var(--text-main)]">
          Plateformes
        </h1>
        <p className="mt-2 text-[var(--text-secondary)]">
          Gestion des plateformes disponibles sur la plateforme.
        </p>
      </div>

      {(error || success) && (
        <div className="space-y-3">
          {error && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
              {success}
            </div>
          )}
        </div>
      )}

      <div className="rounded-3xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-main)]">
              Catalogue des plateformes
            </h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Ajoute, modifie et supprime les plateformes disponibles.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 lg:w-auto lg:flex-row">
            <form
              onSubmit={handleSearchSubmit}
              className="flex w-full flex-col gap-3 sm:flex-row"
            >
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Rechercher une plateforme..."
                className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-3 text-sm text-[var(--text-main)] outline-none transition focus:border-[var(--primary)] lg:w-72"
              />

              <button
                type="submit"
                className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-3 text-sm font-semibold text-[var(--text-main)] transition hover:opacity-90"
              >
                Rechercher
              </button>
            </form>

            <button
              type="button"
              onClick={openCreateForm}
              className="rounded-2xl bg-[var(--primary)] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Ajouter une plateforme
            </button>
          </div>
        </div>

        {isFormOpen && (
          <div className="mt-6 rounded-3xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-5">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-[var(--text-main)]">
                  {editingPlatform ? "Modifier la plateforme" : "Nouvelle plateforme"}
                </h3>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  Renseigne le nom et ajoute un logo si besoin.
                </p>
              </div>

              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-[var(--border-color)] p-2 text-[var(--text-secondary)] transition hover:bg-[var(--bg-card)]"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-5 lg:grid-cols-[1fr_220px]">
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--text-main)]">
                    Nom
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Ex : PlayStation 5"
                    required
                    className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] px-4 py-3 text-sm text-[var(--text-main)] outline-none transition focus:border-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--text-main)]">
                    Logo
                  </label>

                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--border-color)] bg-[var(--bg-card)] px-4 py-6 text-sm text-[var(--text-secondary)] transition hover:border-[var(--primary)]">
                    <ImagePlus size={18} />
                    <span>Choisir une image</span>
                    <input
                      type="file"
                      name="logo"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      onChange={handleChange}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-2xl bg-[var(--primary)] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isSubmitting
                      ? "Enregistrement..."
                      : editingPlatform
                      ? "Mettre à jour"
                      : "Créer la plateforme"}
                  </button>

                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] px-4 py-3 text-sm font-semibold text-[var(--text-main)] transition hover:opacity-90"
                  >
                    Annuler
                  </button>
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-[var(--text-main)]">
                  Aperçu
                </p>

                <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-3xl border border-[var(--border-color)] bg-[var(--bg-card)]">
                  {previewImage ? (
                    <img
                      src={previewImage}
                      alt="Aperçu du logo"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="px-4 text-center text-sm text-[var(--text-secondary)]">
                      Aucun logo sélectionné
                    </span>
                  )}
                </div>
              </div>
            </form>
          </div>
        )}

        <div className="mt-6 overflow-hidden rounded-3xl border border-[var(--border-color)]">
          {isLoading ? (
            <div className="bg-[var(--bg-secondary)] px-5 py-10 text-center text-sm text-[var(--text-secondary)]">
              Chargement des plateformes...
            </div>
          ) : platforms.length === 0 ? (
            <div className="bg-[var(--bg-secondary)] px-5 py-10 text-center">
              <p className="text-sm font-medium text-[var(--text-main)]">
                Aucune plateforme trouvée
              </p>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Ajoute une plateforme ou modifie ta recherche.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[var(--border-color)]">
                <thead className="bg-[var(--bg-secondary)]">
                  <tr>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                      Logo
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                      Nom
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                      Slug
                    </th>
                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[var(--border-color)] bg-[var(--bg-card)]">
                  {platforms.map((platform) => {
                    const logoUrl = platform.logo
                      ? `${getImageUrl(platform.logo)}?t=${platform.updated_at ?? Date.now()}`
                      : null;

                    return (
                      <tr key={platform.id}>
                        <td className="px-5 py-4">
                          <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)]">
                            {logoUrl ? (
                              <img
                                src={logoUrl}
                                alt={platform.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="text-xs text-[var(--text-secondary)]">
                                —
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-5 py-4 text-sm font-medium text-[var(--text-main)]">
                          {platform.name}
                        </td>

                        <td className="px-5 py-4 text-sm text-[var(--text-secondary)]">
                          {platform.slug || "-"}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEditForm(platform)}
                              className="rounded-xl border border-[var(--border-color)] p-2 text-[var(--text-main)] transition hover:bg-[var(--bg-secondary)]"
                              title="Modifier"
                            >
                              <Pencil size={16} />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDelete(platform)}
                              className="rounded-xl border border-red-500/20 p-2 text-red-400 transition hover:bg-red-500/10"
                              title="Supprimer"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {meta && meta.last_page > 1 && (
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-[var(--text-secondary)]">
              {meta.total} plateforme{meta.total > 1 ? "s" : ""} au total
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-2 text-sm font-medium text-[var(--text-main)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Précédent
              </button>

              <span className="text-sm text-[var(--text-secondary)]">
                Page {meta.current_page} / {meta.last_page}
              </span>

              <button
                type="button"
                onClick={() =>
                  setPage((prev) => Math.min(prev + 1, meta.last_page))
                }
                disabled={page === meta.last_page}
                className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-2 text-sm font-medium text-[var(--text-main)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}