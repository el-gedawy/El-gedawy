import { login, watchAuth } from '../services/auth.js';
import { setMessage, toggleLoading } from '../utils/ui.js';

const form = document.getElementById('loginForm');

watchAuth((user) => {
  if (user) {
    // Role redirect will happen after explicit login or existing session profile load in protected pages.
  }
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  setMessage('authMessage', '');
  toggleLoading(true);

  try {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const profile = await login(email, password);

    if (profile.role === 'teacher') {
      window.location.href = './teacher.html';
    } else if (profile.role === 'student') {
      window.location.href = './student.html';
    } else {
      throw new Error('Unknown role. Contact administrator.');
    }
  } catch (error) {
    setMessage('authMessage', error.message || 'Login failed.');
  } finally {
    toggleLoading(false);
  }
});
