import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { env } from '@/config/env';

const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${env.authUrl}/check.php`, {
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => {
        if (data.loggedIn) {
          setIsAuthenticated(true);
        } else {
          navigate('/login');
        }
      })
      .catch(() => navigate('/login'))
      .finally(() => setIsChecking(false));
  }, []);

  if (isChecking) return <p></p>;
  return isAuthenticated ? <>{children}</> : null;
};

export default RequireAuth;
