import React, {useState} from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { authService } from '../api/authService';
import { AuthBanner } from '../components/common/AuthBanner';

const RegisterPage = () => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password || !username || !confirmPassword) {
      alert("Будь ласка, заповни всі поля!");
      return;
    }

    if (password !== confirmPassword) {
      alert("Паролі не збігаються!");
      return;
    }

    setIsLoading(true);

    console.log("Дані готові до відправки на Spring Boot:", { email, password, username });

    try {
      const data = await authService.register({ email, password, username });

      const token = data.token;
      localStorage.setItem("token", token);

      navigate("/map");

    } catch(err: unknown) {
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
  }


  return (
  <div className="flex min-h-screen overflow-y-auto bg-gray-100 lg:h-screen lg:overflow-hidden">
    <AuthBanner/>

    <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      <h1 className="lg:hidden text-3xl font-bold text-blue-600 mb-4 text-center">Vandry</h1>
      <div className="w-[92%] max-w-sm bg-white rounded-2xl shadow-xl p-5 sm:p-6 lg:max-w-md lg:p-7">
        <h2 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-6 text-center">Ласкаво просимо!</h2>
        
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg animate-pulse text-center">
              {error}
            </div>
          )}

        <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-5">
          <div>
              <label className="block text-sm font-medium text-gray-700">Нікнейм</label>
              <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="mt-1 block w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  required
              />
          </div>

          <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  required
              />
          </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Пароль</label>
              <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  required
              />
          </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Підтвердіть пароль</label>
              <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 block w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  required
              />
          </div>

          <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-2.5 rounded-lg font-semibold text-white transition shadow-md ${
                  isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                }`}>
                {isLoading ? 'Реєстрація...' : 'Зареєструватися'}
          </button>
        </form>
          <p className="text-sm pt-4 text-gray-800 text-center"
          >Вже маєте акаунт? Спробуйте <Link className="text-blue-600 underline" to='/login'>Ввійти</Link></p>
      </div>
    </div>
  </div>
  );
};

export default RegisterPage;
