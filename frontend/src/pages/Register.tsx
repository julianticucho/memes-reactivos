import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import authService from "../services/auth";

interface RegisterProps {
  setToast: (toast: { message: string; severity: "success" | "error" }) => void;
}

const Register = ({ setToast }: RegisterProps) => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }
    if (password.length < 3) {
      setError("La contraseña debe tener al menos 3 caracteres");
      return;
    }
    try {
      await authService.register({ username, email, password });
      setToast({
        message: "Cuenta creada. Inicia sesión.",
        severity: "success",
      });
      navigate("/login");
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError("Ocurrió un error al registrarse");
      }
    }
  };

  return (
    <div className="window auth-window">
      <div className="title-bar">
        <div className="title-bar-text">Crear cuenta</div>
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
            type="text"
            required
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            placeholder="Email"
            required
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            placeholder="Contraseña"
            required
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <input
            placeholder="Confirmar contraseña"
            required
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <div className="auth-actions">
            <Link to="/login">¿Ya tienes cuenta? Iniciar sesión</Link>
            <button type="submit">Registrarse</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
