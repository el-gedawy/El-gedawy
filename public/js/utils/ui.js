export const setMessage = (id, text, isError = true) => {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  el.style.color = isError ? '#dc2626' : '#16a34a';
};

export const toggleLoading = (show) => {
  const overlay = document.getElementById('loadingOverlay');
  if (!overlay) return;
  overlay.classList.toggle('hidden', !show);
};

export const setupTabs = () => {
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('.section');
  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      navLinks.forEach((x) => x.classList.remove('active'));
      sections.forEach((x) => x.classList.remove('active'));
      link.classList.add('active');
      document.getElementById(link.dataset.section)?.classList.add('active');
    });
  });
};

export const renderCards = (containerId, html) => {
  const container = document.getElementById(containerId);
  if (container) container.innerHTML = html;
};

export const optionsFromItems = (items, valueKey = 'id', labelKey = 'name') =>
  items.map((item) => `<option value="${item[valueKey]}">${item[labelKey]}</option>`).join('');
