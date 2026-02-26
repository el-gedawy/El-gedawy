import { addDoc, collection, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { db } from '../firebase-config.js';
import { createStudentAccount, getUserProfile, logout, watchAuth } from '../services/auth.js';
import {
  addAttendance,
  addLecture,
  addPoint,
  createGroup,
  deleteLecture,
  getAttendanceStats,
  sendNotification,
  subscribeCollectionByField,
  subscribeGroups,
  subscribeStudentsForTeacher
} from '../services/firestore.js';
import { optionsFromItems, renderCards, setMessage, setupTabs, toggleLoading } from '../utils/ui.js';

setupTabs();
document.getElementById('logoutBtn').addEventListener('click', logout);

let groups = [];
let students = [];
let teacherUid = '';

const fillGroupSelects = () => {
  const options = `<option value="">Select group</option>${optionsFromItems(groups)}`;
  ['studentGroup', 'attendanceGroup', 'pointsGroup', 'lectureGroup', 'notificationGroup'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = options;
  });
};

const fillStudentSelects = (groupId, studentSelectId) => {
  const filtered = students.filter((s) => s.groupId === groupId);
  const el = document.getElementById(studentSelectId);
  if (el) el.innerHTML = `<option value="">Select student</option>${optionsFromItems(filtered, 'uid', 'name')}`;
};

const renderStats = async () => {
  const totalStudents = students.length;
  const groupStats = await Promise.all(groups.map((g) => getAttendanceStats(g.id)));
  const overallTotal = groupStats.reduce((sum, s) => sum + s.total, 0);
  const overallPresent = groupStats.reduce((sum, s) => sum + s.present, 0);
  const attendancePercentage = overallTotal ? Math.round((overallPresent / overallTotal) * 100) : 0;

  renderCards(
    'statsGrid',
    `
    <article class="card"><h4>Total Groups</h4><p>${groups.length}</p></article>
    <article class="card"><h4>Total Students</h4><p>${totalStudents}</p></article>
    <article class="card"><h4>Attendance %</h4><p>${attendancePercentage}%</p></article>
  `
  );
};

const renderStudents = (list = students) => {
  renderCards(
    'studentsList',
    list
      .map(
        (s) => `<article class="card">
          <h4>${s.name}</h4>
          <p class="muted">${s.email}</p>
          <p>Group: ${groups.find((g) => g.id === s.groupId)?.name || 'N/A'}</p>
        </article>`
      )
      .join('')
  );
};

watchAuth(async (authUser) => {
  if (!authUser) return (window.location.href = './index.html');

  toggleLoading(true);
  try {
    const profile = await getUserProfile(authUser.uid);
    if (!profile || profile.role !== 'teacher') {
      window.location.href = './index.html';
      return;
    }

    teacherUid = authUser.uid;
    document.getElementById('welcomeTeacher').textContent = `Welcome, ${profile.name || 'Teacher'}`;

    subscribeGroups(teacherUid, async (items) => {
      groups = items;
      fillGroupSelects();
      renderCards('groupsList', groups.map((g) => `<article class="card"><h4>${g.name}</h4></article>`).join(''));
      await renderStats();
    });

    subscribeStudentsForTeacher(teacherUid, async (items) => {
      students = items;
      renderStudents();
      await renderStats();
    });

    subscribeCollectionByField('lectures', 'createdBy', teacherUid, (items) => {
      renderCards(
        'lecturesList',
        items
          .map(
            (l) => `<article class="card">
            <h4>${l.title}</h4>
            <p>${l.date}</p>
            <p>${l.content}</p>
            <button class="btn danger" data-lecture-id="${l.id}">Delete</button>
          </article>`
          )
          .join('')
      );

      document.querySelectorAll('[data-lecture-id]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          if (!confirm('Delete this lecture?')) return;
          await deleteLecture(btn.dataset.lectureId);
        });
      });
    });
  } catch (error) {
    setMessage('teacherMessage', error.message || 'Failed to initialize dashboard.');
  } finally {
    toggleLoading(false);
  }
});

document.getElementById('groupForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    const name = document.getElementById('groupName').value.trim();
    await createGroup(name, teacherUid);
    event.target.reset();
    setMessage('teacherMessage', 'Group created.', false);
  } catch (error) {
    setMessage('teacherMessage', error.message || 'Could not create group.');
  }
});

document.getElementById('studentForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  toggleLoading(true);
  try {
    const payload = {
      name: document.getElementById('studentName').value.trim(),
      email: document.getElementById('studentEmail').value.trim(),
      password: document.getElementById('studentPassword').value,
      groupId: document.getElementById('studentGroup').value
    };
    await createStudentAccount(payload, teacherUid);
    event.target.reset();
    setMessage('teacherMessage', 'Student account created.', false);
  } catch (error) {
    setMessage('teacherMessage', error.message || 'Could not create student.');
  } finally {
    toggleLoading(false);
  }
});

document.getElementById('studentSearch').addEventListener('input', (event) => {
  const term = event.target.value.toLowerCase().trim();
  const filtered = students.filter((s) => s.name.toLowerCase().includes(term) || s.email.toLowerCase().includes(term));
  renderStudents(filtered);
});

document.getElementById('attendanceGroup').addEventListener('change', (e) => fillStudentSelects(e.target.value, 'attendanceStudent'));
document.getElementById('pointsGroup').addEventListener('change', (e) => fillStudentSelects(e.target.value, 'pointsStudent'));

document.getElementById('attendanceForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    await addAttendance({
      studentId: document.getElementById('attendanceStudent').value,
      groupId: document.getElementById('attendanceGroup').value,
      date: document.getElementById('attendanceDate').value,
      status: document.getElementById('attendanceStatus').value
    });
    event.target.reset();
    setMessage('teacherMessage', 'Attendance recorded.', false);
  } catch (error) {
    setMessage('teacherMessage', error.message || 'Could not save attendance.');
  }
});

document.getElementById('pointsForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    await addPoint({
      studentId: document.getElementById('pointsStudent').value,
      groupId: document.getElementById('pointsGroup').value,
      value: Number(document.getElementById('pointsValue').value),
      note: document.getElementById('pointsNote').value
    });
    event.target.reset();
    setMessage('teacherMessage', 'Points added.', false);
  } catch (error) {
    setMessage('teacherMessage', error.message || 'Could not save points.');
  }
});

document.getElementById('lectureForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    await addLecture({
      groupId: document.getElementById('lectureGroup').value,
      title: document.getElementById('lectureTitle').value,
      date: document.getElementById('lectureDate').value,
      content: document.getElementById('lectureContent').value,
      createdBy: teacherUid
    });
    event.target.reset();
    setMessage('teacherMessage', 'Lecture published.', false);
  } catch (error) {
    setMessage('teacherMessage', error.message || 'Could not add lecture.');
  }
});

document.getElementById('notificationForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    const payload = {
      groupId: document.getElementById('notificationGroup').value,
      title: document.getElementById('notificationTitle').value,
      message: document.getElementById('notificationMessage').value
    };
    await sendNotification(payload);

    const targetStudents = students.filter((s) => s.groupId === payload.groupId);
    await Promise.all(
      targetStudents.map((s) =>
        addDoc(collection(db, 'notification_queue'), {
          token: s.fcmToken || null,
          title: payload.title,
          message: payload.message,
          studentId: s.uid,
          createdAt: serverTimestamp()
        })
      )
    );

    event.target.reset();
    setMessage('teacherMessage', 'Notification queued.', false);
  } catch (error) {
    setMessage('teacherMessage', error.message || 'Could not send notification.');
  }
});
