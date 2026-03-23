import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios'; // Додав імпорт самого axios для надійності
import { authService } from '../api/authService';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null); // Стан для помилки
  const [isLoading, setIsLoading] = useState(false); // Стан для завантаження
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Скидаємо попередню помилку
  
    if (!email || !password) {
      setError("Будь ласка, заповни всі поля!");
      return;
    }

    setIsLoading(true); // Вмикаємо індикатор завантаження

    try {
      console.log("Спроба входу для:", email);
      const data = await authService.login(email, password);
      
      const token = data.token;
      localStorage.setItem('token', token);
      
      console.log("Токен збережено успішно!");
      navigate('/map'); 
      
    } catch (err: unknown) {
      console.error("Помилка при логіні:", err);
      
      // Більш надійна обробка помилки
      if (axios.isAxiosError(err)) {
        const serverMessage = err.response?.data;
        // Якщо сервер повернув рядок, використовуємо його, якщо об'єкт — витягуємо message
        const message = typeof serverMessage === 'string' 
          ? serverMessage 
          : serverMessage?.message || "Неправильний логін або пароль";
        setError(message);
      } else {
        setError("Сталася помилка з'єднання з сервером.");
      }
    } finally {
      setIsLoading(false); // Вимикаємо завантаження в будь-якому випадку
    }
  };

  return (
    <div className="flex min-h-screen overflow-y-auto bg-gray-100 lg:h-screen lg:overflow-hidden">
      {/* Ліва частина залишається без змін */}
      <div className="hidden lg:flex w-1/2 bg-blue-600 items-center justify-center p-10 text-white">
        <div>
          <h1 className="text-4xl xl:text-5xl font-bold mb-4">Vandry</h1>
          <p className="text-lg xl:text-xl">Plan your perfect journey with friends in real-time.</p>
        </div>
      </div>

      {/* Форма */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-4">
        <div className="w-[92%] max-w-sm bg-white rounded-2xl shadow-xl p-6 lg:max-w-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Welcome Back</h2>
          
          {/* Блок для виведення помилки (червоний алерт) */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg animate-pulse text-center">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Email Address</label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 block w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition"
                    required
                />
            </div>

             <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition"
                required
              />
            </div>

            <button
                type="submit"
                disabled={isLoading} // Деактивуємо кнопку під час запиту
                className={`w-full py-2.5 rounded-lg font-semibold text-white transition shadow-md ${
                  isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                }`}>
                {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <p className="text-sm pt-4 text-gray-800 text-center">
            New here? Try to <Link className="text-blue-600 underline" to='/register'>Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;