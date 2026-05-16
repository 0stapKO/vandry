import { Navigate, Outlet, useLocation } from 'react-router-dom';

const ProtectedRoute = () => {
  const token = localStorage.getItem('token');
  const location = useLocation();

  // 🚀 Перевіряємо, чи є в URL параметр публічного маршруту
  const searchParams = new URLSearchParams(location.search);
  const isPublicSharedRoute = searchParams.has('publicRouteId');

  // Якщо токена немає І це НЕ публічний лінк — тоді викидаємо на логін
  if (!token && !isPublicSharedRoute) {
    return <Navigate to="/login" replace />;
  }

  // В іншому випадку пропускаємо на сторінку (MapPage або ProfilePage)
  return <Outlet />; 
};

export default ProtectedRoute;