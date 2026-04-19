import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AdminAuthProvider } from "./context/AdminAuthContext";
import AdminRoute from "./routes/AdminRoute";
import AdminLayout from "./components/layout/AdminLayout";

import Login from "./pages/Login";
import DashboardHome from "./pages/DashboardHome";

function UsersPage() {
  return <div>Users page</div>;
}

function PostsPage() {
  return <div>Posts page</div>;
}

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
            </Route>
          </Route>
        </Routes>
      </AdminAuthProvider>
    </BrowserRouter>
  );
}