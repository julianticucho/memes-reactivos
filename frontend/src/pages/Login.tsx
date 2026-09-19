import { useState } from "react";

const Login = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.SubmitEvent) => {
    e.preventDefault();
    if (isRegister) {
      alert("Registro (aún no implementado)");
    } else {
      alert("Login (aún no implementado)");
    }
  };

  return (
    <>
      <h1>{isRegister ? "Crear cuenta" : "Iniciar sesión"}</h1>
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
          placeholder="Email"
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          placeholder="Contraseña"
          required
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">
          {isRegister ? "Registrarse" : "Iniciar sesión"}
        </button>
      </form>
      <p>
        {isRegister ? "¿Ya tienes cuenta?" : "¿No tienes cuenta?"}{" "}
        <button type="button" onClick={() => setIsRegister(!isRegister)}>
          {isRegister ? "Iniciar sesión" : "Registrarse"}
        </button>
      </p>
    </>
  );
};

export default Login;
