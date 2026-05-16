import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Mail, ArrowLeft, LogOut, Map as MapIcon, Navigation, Clock, Save, Edit2, Trash2, X } from 'lucide-react';

const ProfilePage = () => {
  const navigate = useNavigate();

  const formatCount = (value: number, one: string, few: string, many: string) => {
    const mod10 = value % 10;
    const mod100 = value % 100;

    if (mod10 === 1 && mod100 !== 11) return `${value} ${one}`;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${value} ${few}`;
    return `${value} ${many}`;
  };

  const formatDuration = (seconds: number) => {
    const totalMinutes = Math.round(seconds / 60);
    if (totalMinutes >= 60) {
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      const hoursText = formatCount(hours, 'година', 'години', 'годин');
      if (minutes > 0) {
        const minutesText = formatCount(minutes, 'хвилина', 'хвилини', 'хвилин');
        return `${hoursText} ${minutesText}`;
      }
      return hoursText;
    }
    return formatCount(totalMinutes, 'хвилина', 'хвилини', 'хвилин');
  };

  // User State
  const [profile, setProfile] = useState({ username: '', email: '' });
  const [myRoutes, setMyRoutes] = useState<any[]>([]);
  
  // UI State
  const [isEditing, setIsEditing] = useState(false); // 🚀 НОВИЙ СТАН ДЛЯ ПЕРЕМИКАННЯ ФОРМИ
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Form State
  const [newUsername, setNewUsername] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    fetchProfileData();
    fetchMyRoutes();
  }, []);

  const fetchProfileData = async () => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/login');

    try {
      const response = await fetch('http://localhost:8080/api/user/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setProfile({ username: data.username, email: data.email });
        setNewUsername(data.username);
      } else {
        handleLogout(); 
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMyRoutes = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('http://localhost:8080/api/route', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setMyRoutes(data);
      }
    } catch (error) {
      console.error("Error fetching routes:", error);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (newPassword && newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Нові паролі не співпадають!' });
      return;
    }

    const token = localStorage.getItem('token');
    const payload: any = { username: newUsername };
    if (newPassword) {
      payload.oldPassword = oldPassword;
      payload.newPassword = newPassword;
    }

    try {
      const response = await fetch('http://localhost:8080/api/user/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Профіль успішно оновлено!' });
        setProfile({ ...profile, username: newUsername });
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setIsEditing(false); // 🚀 Вимикаємо режим редагування після успіху
      } else {
        setMessage({ type: 'error', text: data.error || 'Помилка оновлення' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Помилка підключення до сервера' });
    }
  };

  // 🚀 НОВА ФУНКЦІЯ: ВИДАЛЕННЯ МАРШРУТУ
  const handleDeleteRoute = async (e: React.MouseEvent, routeId: number) => {
    e.stopPropagation(); // Зупиняємо клік, щоб не відкрився маршрут
    
    if (!window.confirm("Ви впевнені, що хочете видалити цей маршрут? Цю дію неможливо скасувати.")) {
      return;
    }

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://localhost:8080/api/route/${routeId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        // Оновлюємо стан, залишаючи тільки ті маршрути, які не були видалені
        setMyRoutes(myRoutes.filter(route => route.id !== routeId));
      } else {
        alert("Помилка при видаленні маршруту.");
      }
    } catch (error) {
      console.error("Error deleting route:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const openRouteOnMap = (routeId: number) => {
    navigate(`/map?routeId=${routeId}`);
  };

  if (isLoading) {
    return <div className="h-screen flex items-center justify-center bg-gray-50">Завантаження...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4">
      {/* Top Navigation */}
      <div className="w-full max-w-5xl flex justify-between items-center mb-8">
        <button 
          onClick={() => navigate('/map')}
          className="flex items-center gap-2 text-gray-600 hover:text-blue-600 font-bold bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 transition-all"
        >
          <ArrowLeft size={20} /> Повернутися до мапи
        </button>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 text-red-500 hover:text-red-700 font-bold bg-white px-4 py-2 rounded-xl shadow-sm border border-red-50 transition-all"
        >
          <LogOut size={20} /> Вийти
        </button>
      </div>

      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Profile Info / Settings Form */}
        <div className="md:col-span-1 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 h-fit transition-all">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4 mx-auto shadow-inner">
            <User size={40} className="text-blue-600" />
          </div>
          <h2 className="text-xl font-black text-center text-gray-800 mb-6">Мій Профіль</h2>

          {message.text && (
            <div className={`p-3 rounded-lg mb-4 text-sm font-bold text-center ${message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
              {message.text}
            </div>
          )}

          {!isEditing ? (
            // 🚀 РЕЖИМ ПЕРЕГЛЯДУ (READ-ONLY)
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Ім'я користувача</p>
                <p className="font-bold text-gray-800 text-lg">{profile.username}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Email</p>
                <p className="font-medium text-gray-600">{profile.email}</p>
              </div>
              <button 
                onClick={() => {
                  setIsEditing(true);
                  setMessage({ type: '', text: '' }); // Очищаємо повідомлення
                }}
                className="w-full py-2.5 bg-gray-800 hover:bg-gray-900 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition shadow-sm mt-4"
              >
                <Edit2 size={18} /> Редагувати профіль
              </button>
            </div>
          ) : (
            // 🚀 РЕЖИМ РЕДАГУВАННЯ (ФОРМА)
            <form onSubmit={handleUpdateProfile} className="space-y-4 animate-in fade-in zoom-in duration-200">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 text-gray-400" size={18} />
                  <input 
                    type="email" 
                    value={profile.email} 
                    disabled 
                    className="w-full pl-10 pr-3 py-2 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 text-sm cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ім'я користувача</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 text-gray-400" size={18} />
                  <input 
                    type="text" 
                    value={newUsername} 
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition text-sm font-bold text-gray-800"
                  />
                </div>
              </div>

              <hr className="my-4 border-gray-100" />
              <h3 className="text-sm font-bold text-gray-700">Змінити пароль (необов'язково)</h3>

              <div>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 text-gray-400" size={18} />
                  <input 
                    type="password" 
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Старий пароль"
                    className="w-full pl-10 pr-3 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition text-sm text-gray-800"
                  />
                </div>
              </div>

              <div>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 text-gray-400" size={18} />
                  <input 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Новий пароль"
                    className="w-full pl-10 pr-3 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition text-sm text-gray-800"
                  />
                </div>
              </div>

              <div>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 text-gray-400" size={18} />
                  <input 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Підтвердіть новий пароль"
                    className="w-full pl-10 pr-3 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition text-sm text-gray-800"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2 mt-6">
                <button 
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition shadow-md shadow-blue-200"
                >
                  <Save size={18} /> Зберегти зміни
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setNewUsername(profile.username); // Скидаємо ім'я
                    setOldPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setMessage({ type: '', text: '' });
                  }}
                  className="w-full py-2.5 bg-white text-gray-500 hover:text-gray-700 hover:bg-gray-50 border border-gray-200 font-bold rounded-xl flex items-center justify-center gap-2 transition"
                >
                  <X size={18} /> Скасувати
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Right Column: User's Routes */}
        <div className="md:col-span-2">
          <h2 className="text-2xl font-black text-gray-800 mb-6 flex items-center gap-2">
            <MapIcon className="text-blue-600" /> Мої збережені маршрути
          </h2>

          {myRoutes.length === 0 ? (
            <div className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100 text-center">
              <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapIcon className="text-gray-400" size={32} />
              </div>
              <h3 className="text-lg font-bold text-gray-700 mb-2">У вас ще немає збережених маршрутів</h3>
              <p className="text-gray-500 text-sm mb-6">Створіть свій перший маршрут або оберіть ідею для подорожі на мапі.</p>
              <button 
                onClick={() => navigate('/map')}
                className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition"
              >
                Створити маршрут
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {myRoutes.map(route => (
                <div 
                  key={route.id} 
                  onClick={() => openRouteOnMap(route.id)}
                  className="relative bg-white p-5 rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:border-blue-400 hover:shadow-md transition group overflow-hidden"
                >
                  {/* 🚀 КНОПКА ВИДАЛЕННЯ НА КАРТЦІ */}
                  <button
                    onClick={(e) => handleDeleteRoute(e, route.id)}
                    className="absolute top-3 right-3 p-2 bg-red-50 text-red-400 hover:text-red-600 hover:bg-red-100 rounded-lg opacity-0 group-hover:opacity-100 transition-all z-10"
                    title="Видалити маршрут"
                  >
                    <Trash2 size={18} />
                  </button>

                  <h3 className="text-lg font-bold text-gray-800 mb-3 group-hover:text-blue-600 transition pr-8">{route.name}</h3>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                      <Navigation size={16} className="text-blue-500" /> 
                      {(route.distance / 1000).toFixed(1)} км
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                      <Clock size={16} className="text-green-500" /> 
                      {formatDuration(route.duration)}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                      <MapIcon size={16} className="text-purple-500" />
                      {formatCount(route.stopsCount, 'зупинка', 'зупинки', 'зупинок')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;