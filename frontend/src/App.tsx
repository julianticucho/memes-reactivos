import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useParams,
} from "react-router-dom";
import { useEffect, useState } from "react";

import Navbar from "./components/Navbar";
import useAuthStore from "./store/authStore";
import { isStaff } from "./utils/roles";

import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NewProduct from "./pages/NewProduct";
import EditProduct from "./pages/EditProduct";
import Moderation from "./pages/Moderation";

function ProductRedirect() {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/?product=${id}`} replace />;
}

function App() {
  const [toast, setToast] = useState<{
    message: string;
    severity: "success" | "error";
  } | null>(null);
  const user = useAuthStore((state) => state.user);
  const restoring = useAuthStore((state) => state.restoring);
  const restore = useAuthStore((state) => state.restore);

  useEffect(() => {
    void restore();
  }, [restore]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  return (
    <BrowserRouter>
      {toast && (
        <div className="toast-window window" role="status" aria-live="polite">
          <div className="title-bar">
            <div className="title-bar-text">
              {toast.severity === "success" ? "Éxito" : "Error"}
            </div>
            <div className="title-bar-controls">
              <button
                type="button"
                aria-label="Close"
                onClick={() => setToast(null)}
              />
            </div>
          </div>
          <div className="window-body">{toast.message}</div>
        </div>
      )}

      <div className="window app-window">
        <div className="title-bar">
          <div className="title-bar-text">Marketplace Beauchef</div>
          <div className="title-bar-controls">
            <button type="button" aria-label="Minimize" />
            <button type="button" aria-label="Maximize" />
            <button type="button" aria-label="Close" />
          </div>
        </div>

        <Navbar setToast={setToast} />

        <div className="window-body">
          {restoring ? (
            <p>Cargando...</p>
          ) : (
            <Routes>
              <Route path="/" element={<Home setToast={setToast} />}>
                <Route
                  path="product/new"
                  element={
                    user ? (
                      <NewProduct setToast={setToast} />
                    ) : (
                      <Navigate to="/login" replace />
                    )
                  }
                />
                <Route
                  path="product/:id/edit"
                  element={
                    user ? (
                      <EditProduct setToast={setToast} />
                    ) : (
                      <Navigate to="/login" replace />
                    )
                  }
                />
              </Route>
              <Route path="/product/:id" element={<ProductRedirect />} />
              <Route
                path="/profile"
                element={
                  user ? (
                    <Profile setToast={setToast} />
                  ) : (
                    <Navigate to="/login" replace />
                  )
                }
              />
              <Route
                path="/profile/:id"
                element={<Profile setToast={setToast} />}
              />
              <Route
                path="/login"
                element={
                  user ? (
                    <Navigate to="/" replace />
                  ) : (
                    <Login setToast={setToast} />
                  )
                }
              />
              <Route
                path="/register"
                element={
                  user ? (
                    <Navigate to="/" replace />
                  ) : (
                    <Register setToast={setToast} />
                  )
                }
              />
              <Route
                path="/moderation"
                element={
                  isStaff(user) ? (
                    <Moderation setToast={setToast} />
                  ) : (
                    <Navigate to="/" replace />
                  )
                }
              />
              <Route path="*" element={<h1>Página no encontrada</h1>} />
            </Routes>
          )}
        </div>

        <div className="status-bar">
          <p className="status-bar-field">
            {user
              ? `Conectado como ${user.username}`
              : "No has iniciado sesión"}
          </p>
          <p className="status-bar-field">Marketplace Beauchef</p>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
