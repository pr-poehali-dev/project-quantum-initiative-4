import { useState } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";

const CREDENTIALS = { login: "Yaltataran", password: "Taran220577" };

export default function LoginForm({ onLogin }: { onLogin: () => void }) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (login === CREDENTIALS.login && password === CREDENTIALS.password) {
      sessionStorage.setItem("admin_auth", "1");
      onLogin();
    } else {
      setError(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-gray-800 rounded-2xl p-8 w-full max-w-sm shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <Icon name="Shield" size={28} className="text-brand-yellow" />
          <h1 className="text-2xl font-bold text-white">Admin</h1>
        </div>
        {error && (
          <div className="bg-red-500/20 text-red-300 text-sm px-4 py-2 rounded-lg mb-4">
            Неверный логин или пароль
          </div>
        )}
        <input
          type="text"
          placeholder="Логин"
          value={login}
          onChange={(e) => { setLogin(e.target.value); setError(false); }}
          className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg mb-3 outline-none focus:ring-2 focus:ring-brand-yellow"
        />
        <input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(false); }}
          className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg mb-4 outline-none focus:ring-2 focus:ring-brand-yellow"
        />
        <button type="submit" className="w-full bg-brand-yellow text-gray-900 font-bold py-3 rounded-lg hover:bg-yellow-400 transition-colors">
          Войти
        </button>
        <Link to="/" className="block text-center text-sm text-gray-400 hover:text-white mt-4 transition-colors">
          <Icon name="ArrowLeft" size={14} className="inline mr-1" />
          На главную
        </Link>
      </form>
    </div>
  );
}