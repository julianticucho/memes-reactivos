import { Link, useNavigate } from "react-router-dom";
import { isStaff } from "../utils/roles";
import useAuthStore from "../store/authStore";
import useUiStore from "../store/uiStore";

const Navbar = () => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const notify = useUiStore((state) => state.notify);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout().then(() => {
      notify("Sesión cerrada", "success");
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
