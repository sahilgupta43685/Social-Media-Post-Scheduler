import { useState } from "react";
import { loginUser, registerUser } from "../api/authApi";

function AuthForm({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const payload = isLogin
        ? { email: form.email, password: form.password }
        : form;

      const data = isLogin ? await loginUser(payload) : await registerUser(payload);

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      onAuthSuccess(data.user);
    } catch (err) {
      setError(err.response?.data?.message || "Authentication failed");
    }
  };

  return (
    <form className="card" onSubmit={handleSubmit}>
      <h2>{isLogin ? "Login" : "Register"}</h2>
      {error && <p className="error">{error}</p>}

      {!isLogin && (
        <>
          <label>Name</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            required={!isLogin}
          />
        </>
      )}

      <label>Email</label>
      <input name="email" type="email" value={form.email} onChange={handleChange} required />

      <label>Password</label>
      <input
        name="password"
        type="password"
        value={form.password}
        onChange={handleChange}
        required
      />

      <div className="row">
        <button type="submit">{isLogin ? "Login" : "Register"}</button>
        <button type="button" className="secondary" onClick={() => setIsLogin((prev) => !prev)}>
          {isLogin ? "Switch to Register" : "Switch to Login"}
        </button>
      </div>
    </form>
  );
}

export default AuthForm;
