import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  updateProfile,
  getAuth
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { initializeApp, deleteApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { doc, getDoc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { auth, db, firebaseConfig } from '../firebase-config.js';

export const login = async (email, password) => {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const userRef = doc(db, 'users', cred.user.uid);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) throw new Error('Profile not found for this account.');
  return { uid: cred.user.uid, ...userSnap.data() };
};

export const logout = () => signOut(auth);
export const watchAuth = (handler) => onAuthStateChanged(auth, handler);

export const getUserProfile = async (uid) => {
  const userSnap = await getDoc(doc(db, 'users', uid));
  return userSnap.exists() ? { uid, ...userSnap.data() } : null;
};

export const createStudentAccount = async ({ name, email, password, groupId }, teacherUid) => {
  const secondaryApp = initializeApp(firebaseConfig, `creator-${Date.now()}`);
  const secondaryAuth = getAuth(secondaryApp);

  try {
    const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    await updateProfile(cred.user, { displayName: name });
    await setDoc(doc(db, 'users', cred.user.uid), {
      name,
      email,
      role: 'student',
      groupId,
      createdBy: teacherUid,
      createdAt: serverTimestamp()
    });
  } finally {
    await signOut(secondaryAuth);
    await deleteApp(secondaryApp);
  }
};
