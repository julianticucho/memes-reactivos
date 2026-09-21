import { Link } from "react-router-dom";

export interface User {
  name: string;
  avatar?: string | null;
}

interface NavbarProps {
  user?: User | null;
}

const Navbar = ({ user = null }: NavbarProps) => {
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
      <strong>Marketplace Beauchef</strong>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <Link to="/" style={{ color: "#fff", textDecoration: "none" }}>
          Productos
        </Link>
        <Link
          to="/product/new"
          style={{ color: "#fff", textDecoration: "none" }}
        >
          Publicar
        </Link>
        <Link to="/profile" style={{ color: "#fff", textDecoration: "none" }}>
          {user ? user.name : "NULL"}
        </Link>
        <Link to="/login" style={{ color: "#fff", textDecoration: "none" }}>
          Iniciar sesión
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
