/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

export const login = async (email, password) => {
  try {
    const res = await axios.post('http://127.0.0.1:3000/api/v1/users/login', {
      email,
      password,
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Logged in successfully.');
      setTimeout(() => {
        window.location.assign('/');
      }, 1000);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

export const logout = async () => {
  try {
    const res = await axios.get('http://127.0.0.1:3000/api/v1/users/logout');
    if (res.data.status === 'success') window.location.assign('/login');
  } catch (err) {
    showAlert('error', 'Error in logged out. Try again.');
  }
};
