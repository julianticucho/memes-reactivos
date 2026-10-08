import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useEffect, useState } from "react";

import Navbar from "./components/Navbar";
import type { User } from "./types/users";
import authService from "./services/auth";

import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NewProduct from "./pages/NewProduct";
import ProductDetail from "./pages/ProductDetail";

function App() {
  const [toast, setToast] = useState<{
    message: string;
    severity: "success" | "error";
  } | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [restoring, setRestoring] = useState(true);

  useEffect(() => {
    authService
      .restoreLogin()
      .then(setUser)
      .finally(() => setRestoring(false));
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  return (
    <BrowserRouter>
      {toast && (
        <div
          style={{
            position: "fixed",
            top: 16,
            right: 16,
            padding: "12px 20px",
            borderRadius: 4,
            color: "#fff",
            backgroundColor:
              toast.severity === "success" ? "#4caf50" : "#f44336",
            zIndex: 1000,
          }}
        >
          {toast.message}
        </div>
      )}
      <Navbar user={user} setUser={setUser} />
      <main style={{ padding: 20, maxWidth: 900, margin: "0 auto" }}>
        {restoring
          ? (
              <p>Cargando...</p>
            )
          : (
              <Routes>
                <Route path="/" element={<Home />} />
                <Route
                  path="/profile"
                  element={
                    user ? <Profile user={user} /> : <Navigate to="/login" replace />
                  }
                />
                <Route
                  path="/login"
                  element={
                    user ? <Navigate to="/" replace /> : <Login setUser={setUser} />
                  }
                />
                <Route
                  path="/register"
                  element={user ? <Navigate to="/" replace /> : <Register />}
                />
                <Route
                  path="/product/new"
                  element={
                    user ? <NewProduct /> : <Navigate to="/login" replace />
                  }
                />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="*" element={<h2>Página no encontrada</h2>} />
              </Routes>
            )}
      </main>
    </BrowserRouter>
  );
}

export default App;
