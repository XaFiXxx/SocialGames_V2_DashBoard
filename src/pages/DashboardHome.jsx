import { useEffect, useState } from "react";
import { Users, FileText, MessageSquare, Activity } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../services/api";

function StatCard({ icon: Icon, label, value, helper, isLoading }) {
  return (
    <div className="rounded-3xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--text-secondary)]">{label}</p>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary)] text-white">
          <Icon size={18} />
        </div>
      </div>

      <p className="mt-4 text-2xl font-bold text-[var(--text-main)]">
        {isLoading ? "..." : value}
      </p>

      {helper && (
        <p className="mt-2 text-xs text-[var(--text-secondary)]">{helper}</p>
      )}
    </div>
  );
}

export default function DashboardHome() {
  const [stats, setStats] = useState({
    users: 0,
    posts: 0,
    messages: 0,
    new_users_24h: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchStats() {
      try {
        setIsLoading(true);
        setError("");

        const { data } = await api.get("/api/admin/stats");
        setStats({
          users: data.users ?? 0,
          posts: data.posts ?? 0,
          messages: data.messages ?? 0,
          new_users_24h: data.new_users_24h ?? 0,
        });
      } catch (err) {
        console.error("Erreur chargement stats admin :", err);
        setError("Impossible de charger les statistiques du dashboard.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[var(--text-main)]">
          Dashboard
        </h1>
        <p className="mt-2 text-[var(--text-secondary)]">
          Vue d’ensemble de la plateforme SquadBase.
        </p>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Users}
          label="Utilisateurs"
          value={stats.users}
          helper="Total des comptes"
          isLoading={isLoading}
        />
        <StatCard
          icon={FileText}
          label="Posts"
          value={stats.posts}
          helper="Publications créées"
          isLoading={isLoading}
        />
        <StatCard
          icon={MessageSquare}
          label="Messages"
          value={stats.messages}
          helper="Messages envoyés"
          isLoading={isLoading}
        />
        <StatCard
          icon={Activity}
          label="Nouveaux users 24h"
          value={stats.new_users_24h}
          helper="Inscriptions récentes"
          isLoading={isLoading}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 rounded-3xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-[var(--text-main)]">
              Activité récente
            </h2>
          </div>

          <div className="rounded-2xl border border-dashed border-[var(--border-color)] bg-[var(--bg-secondary)] px-5 py-8 text-center">
            <p className="text-sm font-medium text-[var(--text-main)]">
              Aucun flux d’activité disponible pour le moment
            </p>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Cette section sera branchée lorsque les données d’activité admin
              seront disponibles côté backend.
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6">
          <h2 className="mb-4 text-lg font-semibold text-[var(--text-main)]">
            Actions rapides
          </h2>

          <div className="space-y-3">
            <Link
              to="/users"
              className="inline-flex w-full items-center justify-center rounded-2xl bg-[var(--primary)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--primary-hover)]"
            >
              Voir les utilisateurs
            </Link>

            <Link
              to="/posts"
              className="inline-flex w-full items-center justify-center rounded-2xl border border-[var(--border-color)] px-4 py-3 text-sm font-medium text-[var(--text-main)] transition hover:bg-[var(--bg-secondary)]"
            >
              Gérer les posts
            </Link>

            <button
              type="button"
              disabled
              className="w-full cursor-not-allowed rounded-2xl border border-[var(--border-color)] px-4 py-3 text-sm font-medium text-[var(--text-secondary)] opacity-70"
            >
              Signalements bientôt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}