/* eslint-disable */
import '@babel/polyfill';

import { displayMap } from './mapbox';
import { bookTour } from './stripe';

import { login, logout } from './login';
import { updateSettings } from './updateSettings';
import { showAlert } from './alerts';

// DOM ELEMENTS
const loginForm = document.querySelector('.form--login');
const userDataForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-password');
const mapBox = document.getElementById('map');
const logoutBtn = document.querySelector('.nav__el--logout');
const bookTourBtn = document.getElementById('book-tour');

// DELEGATION
if (mapBox) {
  const locations = JSON.parse(mapBox.dataset.locations);
  displayMap(locations);
}

if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
  });
}

if (userDataForm) {
  userDataForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const form = new FormData();
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);
    updateSettings(form, 'data');
  });
}

if (userPasswordForm) {
  userPasswordForm.addEventListener('submit', async (e) => {
    const passwordCurrentDOM = document.getElementById('password-current');
    const passwordDOM = document.getElementById('password');
    const passwordConfirmDOM = document.getElementById('password-confirm');

    e.preventDefault();

    const currentPassword = passwordCurrentDOM.value;
    const newPassword = passwordDOM.value;
    const newPasswordConfirm = passwordConfirmDOM.value;

    document.querySelector('.save-password.btn').textContent = 'Updating...';

    await updateSettings(
      { currentPassword, newPassword, newPasswordConfirm },
      'password'
    );

    document.querySelector('.save-password.btn').textContent = 'SAVE PASSWORD';
    passwordCurrentDOM.value = '';
    passwordDOM.value = '';
    passwordConfirmDOM.value = '';
  });
}

if (logoutBtn) logoutBtn.addEventListener('click', logout);

if (bookTourBtn)
  bookTourBtn.addEventListener('click', (e) => {
    e.target.textContent = 'Processing...';
    const { tourId } = e.target.dataset;
    bookTour(tourId);
  });

const alertMessage = document.querySelector('body').dataset.alert;
if (alertMessage) showAlert('success', alertMessage, 20);
