import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { isAxiosError } from 'axios';
import api from '../api/axios'; // Імпортуй свій налаштований axios

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate(); // Хук для перенаправлення

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    if (!email || !password) {
      alert("Будь ласка, заповни всі поля!");
      return;
    }

    try {
      // 1. Відправляємо запит на логін
      const response = await api.post('/auth/login', { email, password });
      
      // 2. Отримуємо токен з відповіді (AuthResponse)
      const token = response.data.token;
      
      // 3. Зберігаємо токен у LocalStorage
      localStorage.setItem('token', token);
      
      console.log("Токен збережено успішно!");

      // 4. Перекидаємо користувача на дашборд (або головну)
      navigate('/dashboard'); 
      
    } catch (error: unknown) {
      // Виводимо конкретну помилку від Spring ("Невірний пароль" тощо)
      const message = isAxiosError<string>(error)
        ? error.response?.data || "Помилка входу. Перевірте дані."
        : "Помилка входу. Перевірте дані.";
      alert(message);
    }
  };

  return (
    <div className="flex min-h-screen overflow-y-auto bg-gray-100 lg:h-screen lg:overflow-hidden">
      {/* Left side: Hero/Image (Hidden on mobile) */}
      <div className="hidden lg:flex w-1/2 bg-blue-600 items-center justify-center p-10 text-white xl:p-12">
        <div>
          <h1 className="text-4xl xl:text-5xl font-bold mb-4 xl:mb-6">Vandry</h1>
          <p className="text-lg xl:text-xl">Plan your perfect journey with friends in real-time.</p>
        </div>
      </div>

      {/* Right side: Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
        <h1 className="lg:hidden text-3xl font-bold text-blue-600 mb-4 text-center">Vandry</h1>
        <div className="w-[92%] max-w-sm bg-white rounded-2xl shadow-xl p-5 sm:p-6 lg:max-w-md lg:p-7">
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-6 text-center">Welcome Back</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-5">
            <div>
                <label className="block text-sm font-medium text-gray-700">Email Address</label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 block w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    required
                />
            </div>

             <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 block w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    required
                />
            </div>

            <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition shadow-md">
                Sign In
            </button>
          </form>
         <p className="text-sm pt-4 text-gray-800 text-center">
            New here? Try to <Link className="text-blue-600 underline" to='/register'>Sign up</Link></p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;