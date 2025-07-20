import { env } from '@/config/env';
import type { User } from '@/types';

export async function getCurrentUser(): Promise<User | null> {
  try {
    const res = await fetch(`${env.authUrl}/check.php`, {
      credentials: 'include'
    });
    const data = await res.json();
    const currentUser: User = {
      email: data.user_email,
      name: data.user_name,
    };
    return currentUser;
  } catch (e) {
    console.error('ユーザー取得失敗:', e);
    return { email: '', name: 'Guest' };
  }
}