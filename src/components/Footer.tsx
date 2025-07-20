import React, { useEffect, useState } from 'react';
import type { User } from '@/types';
import { getCurrentUser } from '@/utils/user';
import { env } from '@/config/env';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRightFromBracket } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';

const Header: React.FC = () => {

  const [currentUser, setCurrentUser] = useState<User>({ email: '', name: 'Guest' });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const user = await getCurrentUser();
      if (user) {
        setCurrentUser({ name: user.name, email:user.email});
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();

    try {
      await fetch(`${env.authUrl}/logout.php`, {
        method: 'POST',
        credentials: 'include'
      });
      navigate('/login');
    } catch (err) {
      console.error('ログアウト失敗:', err);
    }
  };

  return (
    <footer className="footer py-10 px-15 fsz-10 text-gray">
      <p className="flex items-center gap-5 fsz-10 mt-2">
        Logged in as {currentUser.email}
        <FontAwesomeIcon
          icon={faRightFromBracket}
          className="pointer mt-3"
          onClick={handleLogout}
          title="ログアウト"
        />
      </p>
    </footer>
  );
};

export default Header;
