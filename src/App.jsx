import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AdminAuthProvider } from "./context/AdminAuthContext";
import AdminRoute from "./routes/AdminRoute";
import AdminLayout from "./components/layout/AdminLayout";

import Login from "./pages/Login";
import DashboardHome from "./pages/DashboardHome";
import UsersPage from "./pages/UsersPage";
import PostsPage from "./pages/PostsPage";
import GamesPage from "./pages/GamesPage";
import GenresPage from "./pages/GenresPage";
import PlatformsPage from "./pages/PlatformsPage";

export default function App() {
  return (
    <BrowserRouter>
      <AdminAuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />

          {/* Protégé */}
          <Route element={<AdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/" element={<DashboardHome />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/posts" element={<PostsPage />} />
              <Route path="/games" element={<GamesPage />} />
              <Route path="/platforms" element={<PlatformsPage />} />
              <Route path="/genres" element={<GenresPage />} />
            </Route>
          </Route>
        </Routes>
      </AdminAuthProvider>
    </BrowserRouter>
  );
}