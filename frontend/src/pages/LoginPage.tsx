import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { authService } from '../api/authService';
import { AuthBanner } from '../components/common/AuthBanner';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
  
    if (!email || !password) {
      setError("Будь ласка, заповни всі поля!");
      return;
    }

    setIsLoading(true);

    try {
      console.log("Спроба входу для:", email);
      const data = await authService.login({email, password});
      
      const token = data.token;
      localStorage.setItem("token", token);
      
      console.log("Токен збережено успішно!");
      navigate('/map'); 
      
    } catch (err: unknown) {
      console.error("Помилка при логіні:", err);
      
      if (axios.isAxiosError(err)) {
        const serverMessage = err.response?.data;
        const message = typeof serverMessage === 'string' 
          ? serverMessage 
          : serverMessage?.message || "Неправильний логін або пароль";
        setError(message);
      } else {
        setError("Сталася помилка з'єднання з сервером.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen overflow-y-auto bg-gray-100 lg:h-screen lg:overflow-hidden">
      {/* Ліва частина */}
      <AuthBanner/>

      {/* Форма */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-4">
        <div className="w-[92%] max-w-sm bg-white rounded-2xl shadow-xl p-6 lg:max-w-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">З поверненням!</h2>
          
          {/* Блок для виведення помилки (червоний алерт) */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg animate-pulse text-center">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 block w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition"
                    required
                />
            </div>

             <div>
              <label className="block text-sm font-medium text-gray-700">Пароль</label>
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
                disabled={isLoading}
                className={`w-full py-2.5 rounded-lg font-semibold text-white transition shadow-md ${
                  isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                }`}>
                {isLoading ? 'Вхід...' : 'Ввійти'}
            </button>
          </form>

          <p className="text-sm pt-4 text-gray-800 text-center">
           Вперше тут? Спробуйте <Link className="text-blue-600 underline" to='/register'>Зареєструватися</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;