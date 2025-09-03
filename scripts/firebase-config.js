// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";
import { getDatabase, ref, set, onValue, push } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDZqFPUz8zGRh-c2CK8B23EIIAdQpRLMPU",
    authDomain: "projectm-2b339.firebaseapp.com",
    projectId: "projectm-2b339",
    storageBucket: "projectm-2b339.firebasestorage.app",
    messagingSenderId: "614291025865",
    appId: "1:614291025865:web:f090cb45b8724dc4b38218",
    measurementId: "G-DPZGSZML24"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const database = getDatabase(app);

// Экспортируем функции для использования в других модулях
export { database, ref, set, onValue, push };