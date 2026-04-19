import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FileText,
  Bell,
  LogOut,
  Search,
  ShieldCheck,
} from "lucide-react";
import { useAdminAuth } from "../../context/AdminAuthContext";

const navigation = [
  {
    name: "Dashboard",
    to: "/",
    icon: LayoutDashboard,
  },
  {
    name: "Utilisateurs",
    to: "/users",
    icon: Users,
  },
  {
    name: "Posts",
    to: "/posts",
    icon: FileText,
  },
];

function SidebarLink({ to, icon: Icon, name }) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
          isActive
            ? "bg-[var(--primary)] text-white shadow-lg"
            : "text-[var(--text-secondary)] hover:bg-[var(--bg-card)] hover:text-[var(--text-main)]"
        }`
      }
    >
      <Icon size={18} />
      <span>{name}</span>
    </NavLink>
  );
}

export default function AdminLayout() {
  const { logout, user } = useAdminAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)]">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 border-r border-[var(--border-color)] bg-[var(--bg-secondary)] xl:flex xl:flex-col">
          <div className="border-b border-[var(--border-color)] px-6 py-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--primary)] text-white shadow-lg">
                <ShieldCheck size={20} />
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                  SquadBase
                </p>
                <h1 className="text-lg font-bold">Admin Panel</h1>
              </div>
            </div>
          </div>

          <div className="flex-1 px-4 py-6">
            <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">
              Navigation
            </p>

            <nav className="space-y-2">
              {navigation.map((item) => (
                <SidebarLink
                  key={item.to}
                  to={item.to}
                  icon={item.icon}
                  name={item.name}
                />
              ))}
            </nav>
          </div>

          <div className="border-t border-[var(--border-color)] p-4">
            <div className="rounded-3xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
              <p className="text-sm font-semibold text-[var(--text-main)]">
                {user?.name || "Administrateur"}
              </p>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">
                {user?.email || "Compte connecté"}
              </p>

              <button
                onClick={handleLogout}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--primary-hover)]"
              >
                <LogOut size={16} />
                Déconnexion
              </button>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-[var(--border-color)] bg-[color:rgba(16,23,38,0.88)] backdrop-blur">
            <div className="flex flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                  Administration
                </p>
                <h2 className="mt-1 text-2xl font-bold tracking-tight">
                  Gestion de la plateforme
                </h2>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-3 text-sm text-[var(--text-secondary)] sm:min-w-72">
                  <Search size={16} />
                  <input
                    type="text"
                    placeholder="Rechercher un utilisateur, un post..."
                    className="w-full bg-transparent outline-none placeholder:text-[var(--text-secondary)]"
                  />
                </div>

                <button
                  type="button"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] transition hover:bg-[var(--bg-card)] hover:text-[var(--text-main)]"
                >
                  <Bell size={18} />
                </button>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-7xl">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}