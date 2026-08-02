import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from './Navbar';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <>
      <Navbar />
      {children}
    </>
  );
};

export default ProtectedRoute;