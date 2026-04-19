import { useEffect, useMemo, useState } from "react";
import { ImagePlus, Trash2, Gamepad2, Pencil } from "lucide-react";
import api from "../services/api";

function formatDate(date) {
  if (!date) return "-";
  try {
    return new Date(date).toLocaleDateString("fr-BE");
  } catch {
    return "-";
  }
}

function getImageUrl(path) {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${import.meta.env.VITE_API_URL}/${path}`;
}

function formatDateForInput(date) {
  if (!date) return "";
  return String(date).slice(0, 10);
}

export default function GamesPage() {
  const [games, setGames] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [genres, setGenres] = useState([]);

  const [meta, setMeta] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingRelations, setIsLoadingRelations] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [genreSearch, setGenreSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [editingGameId, setEditingGameId] = useState(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    release_at: "",
    developer: "",
    publisher: "",
    cover: null,
    existingCover: null,
    platform_ids: [],
    genre_ids: [],
  });

  const previewUrl = useMemo(() => {
    if (form.cover) {
      return URL.createObjectURL(form.cover);
    }

    if (form.existingCover) {
      return getImageUrl(form.existingCover);
    }

    return null;
  }, [form.cover, form.existingCover]);

  const filteredGenres = useMemo(() => {
    const query = genreSearch.trim().toLowerCase();

    const availableGenres = genres.filter(
      (genre) => !form.genre_ids.includes(genre.id)
    );

    if (!query) {
      return availableGenres.slice(0, 20);
    }

    return availableGenres
      .filter((genre) => genre.name.toLowerCase().includes(query))
      .slice(0, 20);
  }, [genres, genreSearch, form.genre_ids]);

  useEffect(() => {
    return () => {
      if (form.cover && previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [form.cover, previewUrl]);

  async function fetchGames(page = 1, searchValue = "") {
    try {
      setIsLoading(true);
      setError("");

      const { data } = await api.get("/api/admin/games", {
        params: {
          page,
          search: searchValue,
        },
      });

      setGames(data.data ?? []);
      setMeta(data);
    } catch (err) {
      console.error("Erreur chargement jeux :", err);
      setError("Impossible de charger les jeux.");
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchRelations() {
    try {
      setIsLoadingRelations(true);

      const [platformsRes, genresRes] = await Promise.all([
        api.get("/api/admin/platforms", {
          params: { page: 1, per_page: 999 },
        }),
        api.get("/api/admin/genres", {
          params: { page: 1, per_page: 999 },
        }),
      ]);

      setPlatforms(platformsRes.data.data ?? []);
      setGenres(genresRes.data.data ?? []);
    } catch (err) {
      console.error("Erreur chargement relations :", err);
      setError("Impossible de charger les plateformes et genres.");
    } finally {
      setIsLoadingRelations(false);
    }
  }

  useEffect(() => {
    fetchGames();
    fetchRelations();
  }, []);

  function handleSearch(e) {
    const value = e.target.value;
    setSearch(value);
    fetchGames(1, value);
  }

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleCoverChange(e) {
    const file = e.target.files?.[0] ?? null;

    setForm((prev) => ({
      ...prev,
      cover: file,
    }));
  }

  function toggleSelection(type, id) {
    setForm((prev) => {
      const currentValues = prev[type];
      const exists = currentValues.includes(id);

      return {
        ...prev,
        [type]: exists
          ? currentValues.filter((item) => item !== id)
          : [...currentValues, id],
      };
    });
  }

  function addGenre(id) {
    setForm((prev) => {
      if (prev.genre_ids.includes(id)) return prev;

      return {
        ...prev,
        genre_ids: [...prev.genre_ids, id],
      };
    });
  }

  function removeGenre(id) {
    setForm((prev) => ({
      ...prev,
      genre_ids: prev.genre_ids.filter((genreId) => genreId !== id),
    }));
  }

  function resetForm() {
    setForm({
      name: "",
      description: "",
      release_at: "",
      developer: "",
      publisher: "",
      cover: null,
      existingCover: null,
      platform_ids: [],
      genre_ids: [],
    });
    setEditingGameId(null);
    setGenreSearch("");
  }

  function handleEdit(game) {
    setEditingGameId(game.id);
    setForm({
      name: game.name || "",
      description: game.description || "",
      release_at: formatDateForInput(game.release_at),
      developer: game.developer || "",
      publisher: game.publisher || "",
      cover: null,
      existingCover: game.cover_img || null,
      platform_ids: (game.platforms || []).map((platform) => platform.id),
      genre_ids: (game.genres || []).map((genre) => genre.id),
    });
    setGenreSearch("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setIsSubmitting(true);
      setError("");

      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("description", form.description || "");
      formData.append("release_at", form.release_at || "");
      formData.append("developer", form.developer || "");
      formData.append("publisher", form.publisher || "");

      form.platform_ids.forEach((id) => {
        formData.append("platform_ids[]", id);
      });

      form.genre_ids.forEach((id) => {
        formData.append("genre_ids[]", id);
      });

      if (form.cover) {
        formData.append("cover", form.cover);
      }

      if (editingGameId) {
        formData.append("_method", "PUT");

        await api.post(`/api/admin/games/${editingGameId}`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      } else {
        await api.post("/api/admin/games", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      }

      resetForm();
      fetchGames(meta?.current_page || 1, search);
    } catch (err) {
      console.error("Erreur sauvegarde jeu :", err);
      alert(err.response?.data?.message || "Impossible d'enregistrer le jeu.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(gameId) {
    const confirmed = window.confirm("Supprimer ce jeu ?");

    if (!confirmed) return;

    try {
      setActionLoadingId(gameId);
      await api.delete(`/api/admin/games/${gameId}`);
      await fetchGames(meta?.current_page || 1, search);

      if (editingGameId === gameId) {
        resetForm();
      }
    } catch (err) {
      console.error("Erreur suppression jeu :", err);
      alert(err.response?.data?.message || "Impossible de supprimer le jeu.");
    } finally {
      setActionLoadingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[var(--text-main)]">Jeux</h1>
        <p className="mt-2 text-[var(--text-secondary)]">
          Gestion du catalogue de jeux vidéo.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-3xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6"
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--primary)] text-white">
            <Gamepad2 size={20} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-main)]">
              {editingGameId ? "Modifier le jeu" : "Ajouter un jeu"}
            </h2>
            <p className="text-sm text-[var(--text-secondary)]">
              {editingGameId
                ? "Mets à jour les informations du jeu sélectionné."
                : "Crée une nouvelle fiche de jeu avec image de couverture."}
            </p>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-4">
          <div className="space-y-4 xl:col-span-3">
            <input
              name="name"
              placeholder="Nom du jeu"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-3 text-sm text-[var(--text-main)] outline-none focus:border-[var(--primary)]"
            />

            <textarea
              name="description"
              placeholder="Description"
              value={form.description}
              onChange={handleChange}
              rows={5}
              className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-3 text-sm text-[var(--text-main)] outline-none focus:border-[var(--primary)]"
            />

            <div className="grid gap-4 md:grid-cols-3">
              <input
                name="developer"
                placeholder="Développeur"
                value={form.developer}
                onChange={handleChange}
                className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-3 text-sm text-[var(--text-main)] outline-none focus:border-[var(--primary)]"
              />

              <input
                name="publisher"
                placeholder="Éditeur"
                value={form.publisher}
                onChange={handleChange}
                className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-3 text-sm text-[var(--text-main)] outline-none focus:border-[var(--primary)]"
              />

              <input
                type="date"
                name="release_at"
                value={form.release_at}
                onChange={handleChange}
                className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-3 text-sm text-[var(--text-main)] outline-none focus:border-[var(--primary)]"
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-3xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4">
                <h3 className="mb-3 text-sm font-semibold text-[var(--text-main)]">
                  Plateformes
                </h3>

                {isLoadingRelations ? (
                  <p className="text-sm text-[var(--text-secondary)]">
                    Chargement...
                  </p>
                ) : platforms.length === 0 ? (
                  <p className="text-sm text-[var(--text-secondary)]">
                    Aucune plateforme disponible.
                  </p>
                ) : (
                  <div className="grid max-h-56 gap-2 overflow-y-auto pr-1">
                    {platforms.map((platform) => {
                      const checked = form.platform_ids.includes(platform.id);

                      return (
                        <label
                          key={platform.id}
                          className="flex cursor-pointer items-center gap-3 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] px-3 py-2"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              toggleSelection("platform_ids", platform.id)
                            }
                            className="h-4 w-4 rounded border-[var(--border-color)]"
                          />

                          {platform.logo ? (
                            <img
                              src={getImageUrl(platform.logo)}
                              alt={platform.name}
                              className="h-8 w-8 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--bg-secondary)] text-xs text-[var(--text-secondary)]">
                              —
                            </div>
                          )}

                          <span className="text-sm text-[var(--text-main)]">
                            {platform.name}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="rounded-3xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4">
                <h3 className="mb-3 text-sm font-semibold text-[var(--text-main)]">
                  Genres
                </h3>

                <input
                  type="text"
                  value={genreSearch}
                  onChange={(e) => setGenreSearch(e.target.value)}
                  placeholder="Rechercher un genre..."
                  className="mb-3 w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] px-4 py-3 text-sm text-[var(--text-main)] outline-none focus:border-[var(--primary)]"
                />

                <div className="mb-3 flex flex-wrap gap-2">
                  {form.genre_ids.length > 0 ? (
                    form.genre_ids.map((id) => {
                      const genre = genres.find((item) => item.id === id);
                      if (!genre) return null;

                      return (
                        <span
                          key={id}
                          className="inline-flex items-center gap-2 rounded-full bg-[var(--bg-card)] px-3 py-1 text-xs text-[var(--text-main)]"
                        >
                          {genre.name}
                          <button
                            type="button"
                            onClick={() => removeGenre(id)}
                            className="text-[var(--text-secondary)] transition hover:text-red-400"
                          >
                            ×
                          </button>
                        </span>
                      );
                    })
                  ) : (
                    <span className="text-sm text-[var(--text-secondary)]">
                      Aucun genre sélectionné.
                    </span>
                  )}
                </div>

                {isLoadingRelations ? (
                  <p className="text-sm text-[var(--text-secondary)]">
                    Chargement...
                  </p>
                ) : genres.length === 0 ? (
                  <p className="text-sm text-[var(--text-secondary)]">
                    Aucun genre disponible.
                  </p>
                ) : (
                  <div className="grid max-h-56 gap-2 overflow-y-auto pr-1">
                    {filteredGenres.length > 0 ? (
                      filteredGenres.map((genre) => (
                        <button
                          key={genre.id}
                          type="button"
                          onClick={() => addGenre(genre.id)}
                          className="flex items-center justify-between rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] px-3 py-2 text-left text-sm text-[var(--text-main)] transition hover:border-[var(--primary)]"
                        >
                          <span>{genre.name}</span>
                          <span className="text-xs text-[var(--text-secondary)]">
                            Ajouter
                          </span>
                        </button>
                      ))
                    ) : (
                      <p className="text-sm text-[var(--text-secondary)]">
                        Aucun genre trouvé.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <label className="flex min-h-[260px] cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-[var(--border-color)] bg-[var(--bg-secondary)] p-4 text-center transition hover:border-[var(--primary)]">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="h-56 w-full rounded-2xl object-cover"
                />
              ) : (
                <>
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--bg-card)] text-[var(--text-secondary)]">
                    <ImagePlus size={22} />
                  </div>
                  <p className="text-sm font-medium text-[var(--text-main)]">
                    Ajouter une image
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">
                    JPG, PNG ou WEBP
                  </p>
                </>
              )}

              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={handleCoverChange}
                className="hidden"
              />
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center rounded-2xl bg-[var(--primary)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--primary-hover)] disabled:opacity-70"
            >
              {isSubmitting
                ? editingGameId
                  ? "Mise à jour..."
                  : "Création..."
                : editingGameId
                ? "Mettre à jour le jeu"
                : "Ajouter le jeu"}
            </button>

            {editingGameId && (
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex w-full items-center justify-center rounded-2xl border border-[var(--border-color)] px-4 py-3 text-sm font-medium text-[var(--text-main)] transition hover:bg-[var(--bg-secondary)]"
              >
                Annuler la modification
              </button>
            )}
          </div>
        </div>
      </form>

      <div className="flex items-center gap-4">
        <input
          type="text"
          placeholder="Rechercher un jeu..."
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
              <th className="px-6 py-4">Image</th>
              <th className="px-6 py-4">Nom</th>
              <th className="px-6 py-4">Plateformes</th>
              <th className="px-6 py-4">Genres</th>
              <th className="px-6 py-4">Développeur</th>
              <th className="px-6 py-4">Éditeur</th>
              <th className="px-6 py-4">Sortie</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              <tr>
                <td
                  colSpan="9"
                  className="px-6 py-6 text-center text-[var(--text-secondary)]"
                >
                  Chargement...
                </td>
              </tr>
            ) : games.length === 0 ? (
              <tr>
                <td
                  colSpan="9"
                  className="px-6 py-6 text-center text-[var(--text-secondary)]"
                >
                  Aucun jeu trouvé.
                </td>
              </tr>
            ) : (
              games.map((game) => (
                <tr
                  key={game.id}
                  className="border-t border-[var(--border-color)]"
                >
                  <td className="px-6 py-4 text-[var(--text-main)]">
                    {game.id}
                  </td>

                  <td className="px-6 py-4">
                    {game.cover_img ? (
                      <img
                        src={`${getImageUrl(game.cover_img)}?t=${game.updated_at ?? Date.now()}`}
                        alt={game.name}
                        className="h-14 w-12 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="flex h-14 w-12 items-center justify-center rounded-xl bg-[var(--bg-secondary)] text-xs text-[var(--text-secondary)]">
                        —
                      </div>
                    )}
                  </td>

                  <td className="px-6 py-4 text-[var(--text-main)]">
                    {game.name}
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      {(game.platforms || []).length > 0 ? (
                        game.platforms.map((platform) => (
                          <span
                            key={platform.id}
                            className="rounded-full bg-[var(--bg-secondary)] px-3 py-1 text-xs text-[var(--text-main)]"
                          >
                            {platform.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-[var(--text-secondary)]">-</span>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      {(game.genres || []).length > 0 ? (
                        game.genres.map((genre) => (
                          <span
                            key={genre.id}
                            className="rounded-full bg-[var(--bg-secondary)] px-3 py-1 text-xs text-[var(--text-main)]"
                          >
                            {genre.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-[var(--text-secondary)]">-</span>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4 text-[var(--text-main)]">
                    {game.developer || "-"}
                  </td>

                  <td className="px-6 py-4 text-[var(--text-main)]">
                    {game.publisher || "-"}
                  </td>

                  <td className="px-6 py-4 text-[var(--text-secondary)]">
                    {formatDate(game.release_at)}
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(game)}
                        className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-color)] px-3 py-2 text-xs font-medium text-[var(--text-main)] transition hover:bg-[var(--bg-secondary)]"
                      >
                        <Pencil size={14} />
                        Modifier
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(game.id)}
                        disabled={actionLoadingId === game.id}
                        className="inline-flex items-center gap-2 rounded-xl bg-red-500/15 px-3 py-2 text-xs font-medium text-red-300 transition hover:bg-red-500/25 disabled:opacity-50"
                      >
                        <Trash2 size={14} />
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
            onClick={() => fetchGames(meta.current_page - 1, search)}
            className="rounded-xl border border-[var(--border-color)] px-4 py-2 text-[var(--text-main)] disabled:opacity-50"
          >
            Précédent
          </button>

          <span className="text-sm text-[var(--text-secondary)]">
            Page {meta.current_page} / {meta.last_page}
          </span>

          <button
            disabled={meta.current_page === meta.last_page}
            onClick={() => fetchGames(meta.current_page + 1, search)}
            className="rounded-xl border border-[var(--border-color)] px-4 py-2 text-[var(--text-main)] disabled:opacity-50"
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
}