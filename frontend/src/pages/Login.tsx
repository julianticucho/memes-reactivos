import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import authService from "../services/auth";
import type { User } from "../types/users";

interface LoginProps {
  setUser: (user: User | null) => void;
  setToast: (toast: {
    message: string;
    severity: "success" | "error";
  }) => void;
}

const Login = ({ setUser, setToast }: LoginProps) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await authService.login({ username, password });
      const loggedUser = await authService.restoreLogin();
      setUser(loggedUser);
      setToast({
        message: `Bienvenido, ${loggedUser?.username ?? username}`,
        severity: "success",
      });
      navigate("/");
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError("Ocurrió un error al iniciar sesión");
      }
    }
  };

  return (
    <>
      <h1>Iniciar sesión</h1>
      {error && (
        <p style={{ color: "#f44336", backgroundColor: "#ffebee", padding: "8px 12px", borderRadius: 4 }}>
          {error}
        </p>
      )}
      <form
        onSubmit={handleSubmit}
        style={{
          maxWidth: 400,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <input
          placeholder="Nombre de usuario"
          required
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          placeholder="Contraseña"
          required
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">Iniciar sesión</button>
      </form>
      <p>
        ¿No tienes cuenta?{" "}
        <Link to="/register">Registrarse</Link>
      </p>
    </>
  );
};

export default Login;
