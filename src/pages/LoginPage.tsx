import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { env } from '@/config/env';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${env.authUrl}/check.php`, {
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => {
        if (data.loggedIn) {
          navigate('/');
        } else {
        }
      })
      .catch(() => navigate('/login'))
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch(`${env.authUrl}/login.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      console.log(data);

      if (res.ok && data.success) {
        console.log(data);
        navigate('/');
      } else {
        setError(data.message || 'ログインに失敗しました');
        console.log(data);
      }
    } catch (err) {
      console.log(err);
      setError('通信エラーが発生しました');
    }
  };

  return (
    <div className="login">
      <h2 className="mb-30 text-center fsz-20 design-font fw-400">修正Canvas</h2>
      <form onSubmit={handleLogin} className="login-form card">
        <div className="mb-20">
          <label htmlFor="username" className="block mb-5 fsz-15">Email </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
            className="p-5"
          />
        </div>
        <div className="mb-30">
          <label htmlFor="username" className="block mb-5 fsz-15">Password </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="p-5"
            />
        </div>
        {error && <p className="error text-center text-red fsz-14 mt-20 mb-20">{error}</p>}
        <button type="submit" className="w-full btn-black fsz-16">ログイン</button>
      </form>
    </div>
  );
};

export default LoginPage;
