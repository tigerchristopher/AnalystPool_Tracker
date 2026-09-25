const form = document.getElementById('tracker-form');
const dateInput = document.getElementById('entry-date');
const memberInput = document.getElementById('member');
const requestorInput = document.getElementById('requestor');
const entryTypeInput = document.getElementById('entry-type');
const taskInput = document.getElementById('task');
const entriesList = document.getElementById('entries-list');
const emptyState = document.getElementById('empty-state');
const entryCount = document.getElementById('entry-count');
const managerCount = document.getElementById('manager-count');
const formMessage = document.getElementById('form-message');
const storageKey = 'analyst-pool-daily-tracker';
let entries = JSON.parse(localStorage.getItem(storageKey) || '[]');
let calendarMonth = new Date(`${getToday()}T00:00:00`);

function getToday() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function getLatestMonday() {
  const today = new Date(`${getToday()}T00:00:00`);
  const daysSinceMonday = (today.getDay() + 6) % 7;
  today.setDate(today.getDate() - daysSinceMonday);
  return today.toISOString().slice(0, 10);
}

function formatDate(dateString) {
  return new Date(`${dateString}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function saveEntries() { localStorage.setItem(storageKey, JSON.stringify(entries)); }

function dateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function renderCalendar() {
  const year = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth();
  const firstDayOffset = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const previousMonthDays = new Date(year, month, 0).getDate();
  const leavesByDate = entries.filter((entry) => entry.entryType === 'Leave').reduce((grouped, entry) => { (grouped[entry.date] ||= []).push(entry); return grouped; }, {});
  document.getElementById('calendar-title').textContent = new Date(year, month, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  document.getElementById('calendar-grid').innerHTML = Array.from({ length: 42 }, (_, index) => {
    const dayNumber = index - firstDayOffset + 1;
    const inCurrentMonth = dayNumber > 0 && dayNumber <= daysInMonth;
    const actualDay = dayNumber <= 0 ? previousMonthDays + dayNumber : dayNumber > daysInMonth ? dayNumber - daysInMonth : dayNumber;
    const actualMonth = dayNumber <= 0 ? month - 1 : dayNumber > daysInMonth ? month + 1 : month;
    const actualYear = actualMonth < 0 ? year - 1 : actualMonth > 11 ? year + 1 : year;
    const key = dateKey(actualYear, (actualMonth + 12) % 12, actualDay);
    const leaveMarkup = (leavesByDate[key] || []).map((entry) => `<span class="leave-chip" title="${entry.member} is on leave">${entry.member}</span>`).join('');
    return `<div class="calendar-day${inCurrentMonth ? '' : ' outside-month'}${key === getToday() ? ' today' : ''}"><span class="day-number">${actualDay}</span>${leaveMarkup}</div>`;
  }).join('');
}

function renderEntries() {
  const searchTerm = document.getElementById('search').value.trim().toLowerCase();
  const fromDate = document.getElementById('filter-from').value;
  const toDate = document.getElementById('filter-to').value;
  const visibleEntries = entries.filter((entry) => (!fromDate || entry.date >= fromDate) && (!toDate || entry.date <= toDate)).filter((entry) => !searchTerm || `${entry.member} ${entry.requestor || ''} ${entry.entryType || ''} ${entry.task}`.toLowerCase().includes(searchTerm)).sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
  entriesList.innerHTML = visibleEntries.map((entry) => `<article class="entry-row"><div class="entry-date">${formatDate(entry.date)}</div><div class="member-avatar" aria-hidden="true">${entry.member.split(' ').map((part) => part[0]).join('').slice(0, 2)}</div><div class="entry-content"><strong>${entry.member}</strong><span class="requestor-label">${entry.entryType || 'Task performed'} · Requested by ${entry.requestor || 'Not specified'}</span><p>${entry.task || 'On leave'}</p></div><button class="delete-btn" type="button" data-id="${entry.id}" aria-label="Delete entry for ${entry.member}" title="Delete entry">×</button></article>`).join('');
  entriesList.querySelectorAll('.delete-btn').forEach((button) => button.addEventListener('click', () => { entries = entries.filter((entry) => entry.id !== button.dataset.id); saveEntries(); renderEntries(); }));
  emptyState.hidden = visibleEntries.length > 0;
  emptyState.querySelector('h4').textContent = visibleEntries.length || (!searchTerm && !fromDate && !toDate) ? 'No tasks logged yet.' : 'No entries found.';
  emptyState.querySelector('p').textContent = visibleEntries.length || (!searchTerm && !fromDate && !toDate) ? 'Entries submitted by team members will appear here.' : 'Try a different search or date range.';
  entryCount.textContent = `${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}`;
  managerCount.textContent = entries.length;
  renderCalendar();
}

function showView(viewId) {
  document.querySelectorAll('.role-btn').forEach((button) => button.classList.toggle('active', button.dataset.view === viewId));
  document.querySelectorAll('.view-panel').forEach((panel) => panel.classList.toggle('active', panel.id === viewId));
  const manager = viewId === 'manager-view';
  document.getElementById('view-kicker').textContent = manager ? 'Manager workspace' : 'Team member workspace';
  document.getElementById('view-title').textContent = manager ? 'See the team’s day at a glance.' : 'Log your work for today.';
  document.getElementById('view-copy').textContent = manager ? 'Review every task recorded by the Analyst Pool.' : 'Add a clear note about the task you completed.';
  renderEntries();
}

document.querySelectorAll('.role-btn').forEach((button) => button.addEventListener('click', () => showView(button.dataset.view)));
document.querySelectorAll('.manager-tab').forEach((button) => button.addEventListener('click', () => {
  document.querySelectorAll('.manager-tab').forEach((tab) => { const active = tab === button; tab.classList.toggle('active', active); tab.setAttribute('aria-selected', active); });
  document.querySelectorAll('.manager-tab-panel').forEach((panel) => { const active = panel.id === button.dataset.managerTab; panel.classList.toggle('active', active); panel.hidden = !active; });
}));
dateInput.value = getToday();
document.getElementById('today-label').textContent = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
taskInput.addEventListener('input', () => { document.getElementById('character-count').textContent = taskInput.value.length; });
entryTypeInput.addEventListener('change', () => { const isLeave = entryTypeInput.value === 'Leave'; taskInput.required = !isLeave; document.getElementById('task-label').textContent = isLeave ? 'Leave note (optional)' : 'Task performed'; taskInput.placeholder = isLeave ? 'Optional note about the leave...' : 'Describe the work completed today...'; });
document.getElementById('search').addEventListener('input', renderEntries);
document.getElementById('filter-from').addEventListener('input', renderEntries);
document.getElementById('filter-to').addEventListener('input', renderEntries);
document.getElementById('filter-from').value = getLatestMonday();
document.getElementById('filter-to').value = getToday();
document.getElementById('previous-month').addEventListener('click', () => { calendarMonth.setMonth(calendarMonth.getMonth() - 1); renderCalendar(); });
document.getElementById('next-month').addEventListener('click', () => { calendarMonth.setMonth(calendarMonth.getMonth() + 1); renderCalendar(); });

form.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!form.checkValidity()) { formMessage.textContent = 'Add a date, both names, entry type, and task details to continue.'; formMessage.className = 'form-message error'; form.reportValidity(); return; }
  entries.push({ id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`, date: dateInput.value, member: memberInput.value, requestor: requestorInput.value.trim(), entryType: entryTypeInput.value, task: taskInput.value.trim(), createdAt: Date.now() });
  saveEntries(); form.reset(); dateInput.value = getToday(); document.getElementById('character-count').textContent = '0'; formMessage.textContent = 'Task added. Your manager can now see it.'; formMessage.className = 'form-message success'; renderEntries();
});

document.getElementById('export-btn').addEventListener('click', () => {
  if (!entries.length) return;
  const csv = [['Date', 'Name of member', 'Requestor name', 'Entry type', 'Task performed'], ...entries.map((entry) => [entry.date, entry.member, entry.requestor || 'Not specified', entry.entryType || 'Task performed', entry.task])].map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(',')).join('\n');
  const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); link.download = `analyst-pool-tracker-${getToday()}.csv`; link.click(); URL.revokeObjectURL(link.href);
});

showView('member-view');