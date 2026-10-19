import { Link, useNavigate } from "react-router-dom";
import type { User } from "../types/users";
import authService from "../services/auth";
import { isStaff } from "../utils/roles";

interface NavbarProps {
  user: User | null;
  setUser: (user: User | null) => void;
  setToast: (toast: { message: string; severity: "success" | "error" }) => void;
}

const Navbar = ({ user, setUser, setToast }: NavbarProps) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    authService.logout().then(() => {
      setUser(null);
      setToast({ message: "Sesión cerrada", severity: "success" });
      navigate("/");
    });
  };

  return (
    <nav className="menu-bar">
      <Link to="/">Productos</Link>
      <Link to="/product/new">Publicar</Link>
      {isStaff(user) && <Link to="/moderation">Moderación</Link>}

      <span className="menu-spacer" />

      {user ? (
        <>
          <Link to="/profile" className="menu-user">
            {user.username}
          </Link>
          <button type="button" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </>
      ) : (
        <>
          <Link to="/login">Iniciar sesión</Link>
          <Link to="/register">Registrarse</Link>
        </>
      )}
    </nav>
  );
};

export default Navbar;
