const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const KEY = 'gym-week-v1';

const blankDay = () => ({ summary: '', done: false, workouts: [] });

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s && Array.isArray(s.days) && Array.isArray(s.saved)) return s;
  } catch {}
  return { days: DAYS.map(blankDay), saved: ['Lower body', 'Upper body', 'Push', 'Pull'] };
}

let state = load();
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {} };

const $ = (sel, el = document) => el.querySelector(sel);
const daysEl = $('#days');
const savedEl = $('#saved');
const tpl = $('#day-tpl');

function render() {
  daysEl.replaceChildren(...state.days.map(renderDay));
  renderSaved();
}

function renderDay(day, i) {
  const el = tpl.content.firstElementChild.cloneNode(true);
  el.classList.toggle('is-done', day.done);
  $('.day-name', el).textContent = DAYS[i];

  const done = $('.done', el);
  done.checked = day.done;
  done.onchange = () => { day.done = done.checked; save(); el.classList.toggle('is-done', day.done); };

  const summary = $('.summary', el);
  summary.value = day.summary;
  summary.oninput = () => { day.summary = summary.value; save(); };

  $('.workouts', el).replaceChildren(...day.workouts.map((name, j) => {
    const li = document.createElement('li');
    li.append(name, removeBtn(() => { day.workouts.splice(j, 1); save(); render(); }));
    return li;
  }));

  const picker = $('.picker', el);
  for (const name of state.saved) picker.add(new Option(name, name));
  picker.onchange = () => {
    if (!picker.value) return;
    day.workouts.push(picker.value);
    save(); render();
  };
  return el;
}

function renderSaved() {
  if (!state.saved.length) {
    const li = document.createElement('li');
    li.className = 'empty';
    li.textContent = 'No saved workouts yet.';
    savedEl.replaceChildren(li);
    return;
  }
  savedEl.replaceChildren(...state.saved.map((name, i) => {
    const li = document.createElement('li');
    li.append(name, removeBtn(() => { state.saved.splice(i, 1); save(); render(); }));
    return li;
  }));
}

function removeBtn(onClick) {
  const b = document.createElement('button');
  b.className = 'x';
  b.textContent = '×';
  b.ariaLabel = 'Remove';
  b.onclick = onClick;
  return b;
}

$('#add-saved').onsubmit = (e) => {
  e.preventDefault();
  const input = $('#saved-name');
  const name = input.value.trim();
  if (name && !state.saved.includes(name)) { state.saved.push(name); save(); render(); }
  input.value = '';
};

$('#new-week').onclick = () => {
  if (!confirm('Start a new week? Your plan stays, ticks are cleared.')) return;
  state.days.forEach((d) => { d.done = false; });
  save(); render();
};

render();
