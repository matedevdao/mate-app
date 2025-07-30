import { initializeApp } from 'firebase/app';
import { getMessaging } from 'firebase/messaging/sw';

const firebaseApp = initializeApp({
  apiKey: 'AIzaSyBbwkLP-C61kWmzCq-pFdvSJXHHUjmoRK0',
  authDomain: 'mate-ba361.firebaseapp.com',
  projectId: 'mate-ba361',
  storageBucket: 'mate-ba361.firebasestorage.app',
  messagingSenderId: '996341622273',
  appId: '1:996341622273:web:f1a110eea9820b30ad8200',
  measurementId: 'G-1V0KFDFZTF'
});

getMessaging(firebaseApp);
