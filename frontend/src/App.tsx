import { BrowserRouter, Route, Routes } from "react-router-dom";
import { useEffect, useState } from "react";

import Navbar, { type User } from "./components/Navbar";

import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import NewProduct from "./pages/NewProduct";
import ProductDetail from "./pages/ProductDetail";

const DEMO_USER: User = { name: "Usuario Ejemplo" };

function App() {
  const [toast, setToast] = useState<{
    message: string;
    severity: "success" | "error";
  } | null>(null);

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
      <Navbar user={DEMO_USER} />
      <main style={{ padding: 20, maxWidth: 900, margin: "0 auto" }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/login" element={<Login />} />
          <Route path="/product/new" element={<NewProduct />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="*" element={<h2>Página no encontrada</h2>} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;
