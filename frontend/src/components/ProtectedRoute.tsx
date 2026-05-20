import { Navigate, Outlet, useLocation } from 'react-router-dom';

const ProtectedRoute = () => {
  const token = localStorage.getItem('token');
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const isPublicSharedRoute = searchParams.has('publicRouteId');

  if (!token && !isPublicSharedRoute) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />; 
};

export default ProtectedRoute;