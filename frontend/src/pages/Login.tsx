import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import useAuthStore from "../store/authStore";
import useUiStore from "../store/uiStore";

const Login = () => {
  const login = useAuthStore((state) => state.login);
  const notify = useUiStore((state) => state.notify);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const loggedUser = await login({ username, password });
      notify(`Bienvenido, ${loggedUser?.username ?? username}`, "success");
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
    <div className="window auth-window">
      <div className="title-bar">
        <div className="title-bar-text">Iniciar sesión</div>
        <div className="title-bar-controls">
          <button type="button" aria-label="Minimize" />
          <button type="button" aria-label="Maximize" />
          <button type="button" aria-label="Close" />
        </div>
      </div>
      <div className="window-body">
        {error && (
          <p
            style={{
              color: "#f44336",
              backgroundColor: "#ffebee",
              padding: "8px 12px",
              borderRadius: 4,
            }}
          >
            {error}
          </p>
        )}
        <form className="auth-form" onSubmit={handleSubmit}>
          <input
            placeholder="Nombre de usuario"
            required
            autoComplete="username"
            type="text"
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
          <div className="auth-actions">
            <Link to="/register">¿No tienes cuenta? Registrarse</Link>
            <button type="submit">Iniciar sesión</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
