import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// lewin550
const firebaseConfig = {
    apiKey: "AIzaSyBYHC7mgehcnO58aE8PQYJqyxUSToZGioo",
    authDomain: "sample-bdcb1.firebaseapp.com",
    databaseURL: "https://sample-bdcb1-default-rtdb.firebaseio.com",
    projectId: "sample-bdcb1",
    storageBucket: "sample-bdcb1.appspot.com",
    messagingSenderId: "525120777563",
    appId: "1:525120777563:web:6be05da75085ec7aa37e7e"
};

// hasukolewin
// const firebaseConfig = {
//     apiKey: "AIzaSyAMpISjQvK3j8l4fuAMrbn3dhHgt4Ou1PU",
//     authDomain: "test-52d4b.firebaseapp.com",
//     projectId: "test-52d4b",
//     storageBucket: "test-52d4b.appspot.com",
//     messagingSenderId: "1026117556559",
//     appId: "1:1026117556559:web:530f69015903f606584d3a"
// };

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
export default app;
export { app, db };