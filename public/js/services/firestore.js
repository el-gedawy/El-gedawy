import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { getToken } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging.js';
import { db, getMessagingClient } from '../firebase-config.js';

export const createGroup = async (name, createdBy) => {
  const id = crypto.randomUUID();
  await setDoc(doc(db, 'groups', id), { id, name, createdBy, createdAt: serverTimestamp() });
};

export const subscribeGroups = (teacherUid, callback) => {
  const q = query(collection(db, 'groups'), where('createdBy', '==', teacherUid), orderBy('name'));
  return onSnapshot(q, (snap) => callback(snap.docs.map((d) => d.data())));
};

export const subscribeStudentsForTeacher = (teacherUid, callback) => {
  const q = query(collection(db, 'users'), where('createdBy', '==', teacherUid), orderBy('name'));
  return onSnapshot(q, (snap) => callback(snap.docs.map((d) => ({ uid: d.id, ...d.data() }))));
};

export const addAttendance = async (payload) => addDoc(collection(db, 'attendance'), { ...payload, createdAt: serverTimestamp() });
export const addPoint = async (payload) => addDoc(collection(db, 'points'), { ...payload, createdAt: serverTimestamp() });
export const addLecture = async (payload) => addDoc(collection(db, 'lectures'), { ...payload, createdAt: serverTimestamp() });

export const deleteLecture = async (lectureId) => deleteDoc(doc(db, 'lectures', lectureId));

export const sendNotification = async (payload) => addDoc(collection(db, 'notifications'), { ...payload, timestamp: serverTimestamp() });

export const subscribeCollectionByField = (name, field, value, callback, orderField = 'createdAt') => {
  const q = query(collection(db, name), where(field, '==', value), orderBy(orderField, 'desc'));
  return onSnapshot(q, (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
};

export const getAttendanceStats = async (groupId) => {
  const snap = await getDocs(query(collection(db, 'attendance'), where('groupId', '==', groupId)));
  const total = snap.size;
  const present = snap.docs.filter((d) => d.data().status === 'Present').length;
  return { total, present, percentage: total ? Math.round((present / total) * 100) : 0 };
};

export const registerNotificationToken = async (uid) => {
  const messaging = await getMessagingClient();
  if (!messaging) return;
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return;

  const token = await getToken(messaging, { vapidKey: 'YOUR_PUBLIC_VAPID_KEY' });
  if (!token) return;

  await setDoc(doc(db, 'users', uid), { fcmToken: token }, { merge: true });
};
