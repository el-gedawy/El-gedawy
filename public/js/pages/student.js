import { collection, getDocs, query, where } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { db } from '../firebase-config.js';
import { getUserProfile, logout, watchAuth } from '../services/auth.js';
import { registerNotificationToken, subscribeCollectionByField } from '../services/firestore.js';
import { renderCards, setMessage, setupTabs, toggleLoading } from '../utils/ui.js';

setupTabs();
document.getElementById('logoutBtn').addEventListener('click', logout);

let attendanceEntries = [];
let pointsEntries = [];

const renderSummary = () => {
  const presentCount = attendanceEntries.filter((x) => x.status === 'Present').length;
  const attendancePercentage = attendanceEntries.length ? Math.round((presentCount / attendanceEntries.length) * 100) : 0;
  const totalPoints = pointsEntries.reduce((sum, p) => sum + Number(p.value || 0), 0);

  renderCards(
    'studentStats',
    `<article class="card"><h4>Total Attendance Entries</h4><p>${attendanceEntries.length}</p></article>
     <article class="card"><h4>Attendance %</h4><p>${attendancePercentage}%</p></article>
     <article class="card"><h4>Total Points</h4><p>${totalPoints}</p></article>`
  );
};

watchAuth(async (authUser) => {
  if (!authUser) return (window.location.href = './index.html');

  toggleLoading(true);
  try {
    const profile = await getUserProfile(authUser.uid);
    if (!profile || profile.role !== 'student') {
      window.location.href = './index.html';
      return;
    }

    document.getElementById('welcomeStudent').textContent = `Welcome, ${profile.name}`;

    const groupSnap = await getDocs(query(collection(db, 'groups'), where('id', '==', profile.groupId)));
    const group = groupSnap.docs[0]?.data();
    document.getElementById('groupName').textContent = `Group: ${group?.name || 'Not assigned'}`;

    subscribeCollectionByField('attendance', 'studentId', authUser.uid, (items) => {
      attendanceEntries = items;
      renderCards(
        'attendanceList',
        items.map((a) => `<article class="card"><h4>${a.date}</h4><p>Status: ${a.status}</p></article>`).join('')
      );
      renderSummary();
    });

    subscribeCollectionByField('points', 'studentId', authUser.uid, (items) => {
      pointsEntries = items;
      renderSummary();
    });

    subscribeCollectionByField('lectures', 'groupId', profile.groupId, (items) => {
      renderCards(
        'lecturesList',
        items
          .map((l) => `<article class="card"><h4>${l.title}</h4><p>${l.date}</p><p>${l.content}</p></article>`)
          .join('')
      );
    });

    subscribeCollectionByField(
      'notifications',
      'groupId',
      profile.groupId,
      (items) => {
        renderCards(
          'notificationsList',
          items.map((n) => `<article class="card"><h4>${n.title}</h4><p>${n.message}</p></article>`).join('')
        );
      },
      'timestamp'
    );

    await registerNotificationToken(authUser.uid);
  } catch (error) {
    setMessage('studentMessage', error.message || 'Failed to load dashboard.');
  } finally {
    toggleLoading(false);
  }
});
