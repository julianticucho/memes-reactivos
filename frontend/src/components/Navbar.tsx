import { Link, useNavigate } from "react-router-dom";
import type { User } from "../types/users";
import authService from "../services/auth";

interface NavbarProps {
  user: User | null;
  setUser: (user: User | null) => void;
}

const Navbar = ({ user, setUser }: NavbarProps) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    authService.logout().then(() => {
      setUser(null);
      navigate("/");
    });
  };

  return (
    <nav
      style={{
        padding: "12px 20px",
        backgroundColor: "#333",
        color: "#fff",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <Link
        to="/"
        style={{ color: "#fff", textDecoration: "none", fontWeight: "bold" }}
      >
        Marketplace Beauchef
      </Link>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <Link to="/" style={{ color: "#fff", textDecoration: "none" }}>
          Productos
        </Link>
        <Link to="/product/new" style={{ color: "#fff", textDecoration: "none" }}>
          Publicar
        </Link>
        {user
          ? (
              <>
                <Link to="/profile" style={{ color: "#fff", textDecoration: "none" }}>
                  {user.username}
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  style={{
                    backgroundColor: "transparent",
                    border: "1px solid #fff",
                    color: "#fff",
                    padding: "4px 10px",
                    borderRadius: 4,
                    cursor: "pointer",
                  }}
                >
                  Cerrar sesión
                </button>
              </>
            )
          : (
              <>
                <Link to="/login" style={{ color: "#fff", textDecoration: "none" }}>
                  Iniciar sesión
                </Link>
                <Link
                  to="/register"
                  style={{
                    color: "#333",
                    textDecoration: "none",
                    backgroundColor: "#fff",
                    padding: "4px 10px",
                    borderRadius: 4,
                  }}
                >
                  Registrarse
                </Link>
              </>
            )}
      </div>
    </nav>
  );
};

export default Navbar;
