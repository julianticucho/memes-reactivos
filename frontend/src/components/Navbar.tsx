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
    <nav className="menu-bar">
      <Link to="/">Productos</Link>
      <Link to="/product/new">Publicar</Link>

      <span className="menu-spacer" />

      {user
        ? (
            <>
              <Link to="/profile" className="menu-user">
                {user.username}
              </Link>
              <button type="button" onClick={handleLogout}>
                Cerrar sesión
              </button>
            </>
          )
        : (
            <>
              <Link to="/login">Iniciar sesión</Link>
              <Link to="/register">Registrarse</Link>
            </>
          )}
    </nav>
  );
};

export default Navbar;
