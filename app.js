// 작성일시: 2026-10-01 11:29 (KST)

const STORAGE_KEY = "todos";
const FILTER_KEY = "filter";
const CATEGORY_LABELS = { work: "업무", personal: "개인", study: "공부" };
const FILTERS = ["all", "work", "personal", "study"];
const FILTER_LABELS = { all: "전체", ...CATEGORY_LABELS };

// ---------- 상태 ----------
let todos = [];
let filter = "all";
let editingId = null;

// ---------- DOM ----------
const warningEl = document.getElementById("storage-warning");
const formEl = document.getElementById("add-form");
const inputEl = document.getElementById("todo-input");
const categoryEl = document.getElementById("category-select");
const progressEl = document.getElementById("progress");
const filtersEl = document.getElementById("filters");
const emptyEl = document.getElementById("empty-message");
const listEl = document.getElementById("todo-list");

// ---------- 저장 ----------
function loadTodos() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (e) {
    return [];
  }
}

function saveTodos() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch (e) {
    warningEl.hidden = false;
  }
}

function loadFilter() {
  try {
    const saved = localStorage.getItem(FILTER_KEY);
    return FILTERS.includes(saved) ? saved : "all";
  } catch (e) {
    return "all";
  }
}

function saveFilter() {
  try {
    localStorage.setItem(FILTER_KEY, filter);
  } catch (e) {
    warningEl.hidden = false;
  }
}

// ---------- 액션 ----------
function createId() {
  if (window.crypto && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function addTodo(text, category) {
  const trimmed = text.trim();
  if (!trimmed) return false;
  todos.push({
    id: createId(),
    text: trimmed,
    category: category,
    done: false,
    createdAt: new Date().toISOString(),
  });
  saveTodos();
  render();
  return true;
}

function updateTodo(id, text, category) {
  const todo = todos.find((t) => t.id === id);
  if (!todo) return;
  todo.text = text;
  todo.category = category;
  saveTodos();
}

function deleteTodo(id) {
  if (!confirm("이 할 일을 삭제할까요?")) return;
  todos = todos.filter((todo) => todo.id !== id);
  saveTodos();
  render();
}

function toggleTodo(id) {
  const todo = todos.find((t) => t.id === id);
  if (!todo) return;
  todo.done = !todo.done;
  saveTodos();
  render();
}

function setFilter(value) {
  if (!FILTERS.includes(value)) return;
  filter = value;
  editingId = null;
  saveFilter();
  render();
}

function startEdit(id) {
  editingId = id;
  render();
}

function cancelEdit() {
  editingId = null;
  render();
}

// 입력값이 비어 있으면 원래 내용을 그대로 두고 수정 모드만 닫는다.
function commitEdit(li) {
  const id = li.dataset.id;
  const text = li.querySelector(".edit-text").value.trim();
  const category = li.querySelector(".edit-category").value;
  editingId = null;
  if (text) updateTodo(id, text, category);
  render();
}

// ---------- 렌더링 ----------
function getVisibleTodos() {
  return filter === "all" ? todos : todos.filter((t) => t.category === filter);
}

function createButton(action, label, ariaLabel, extraClass) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "btn-small " + extraClass;
  button.dataset.action = action;
  button.textContent = label;
  button.setAttribute("aria-label", ariaLabel);
  return button;
}

function createTodoItem(todo) {
  const li = document.createElement("li");
  li.className = "todo-item" + (todo.done ? " done" : "");
  li.dataset.id = todo.id;

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.id = "todo-" + todo.id;
  checkbox.checked = todo.done;
  checkbox.dataset.action = "toggle";

  // 체크박스의 이름은 숨김 label로 연결하고, 화면에 보이는 글자는 더블클릭 수정 대상인 span으로 둔다.
  const label = document.createElement("label");
  label.className = "visually-hidden";
  label.htmlFor = checkbox.id;
  label.textContent = todo.text;

  const text = document.createElement("span");
  text.className = "todo-text";
  text.setAttribute("aria-hidden", "true");
  text.textContent = todo.text;

  const badge = document.createElement("span");
  badge.className = "badge badge-" + todo.category;
  badge.textContent = CATEGORY_LABELS[todo.category] || todo.category;

  li.append(
    checkbox,
    label,
    text,
    badge,
    createButton("edit", "수정", "수정: " + todo.text, "btn-edit"),
    createButton("delete", "삭제", "삭제: " + todo.text, "btn-delete")
  );
  return li;
}

function createEditItem(todo) {
  const li = document.createElement("li");
  li.className = "todo-item editing";
  li.dataset.id = todo.id;

  const input = document.createElement("input");
  input.type = "text";
  input.className = "edit-text";
  input.maxLength = 100;
  input.value = todo.text;
  input.setAttribute("aria-label", "할 일 수정");

  const select = document.createElement("select");
  select.className = "edit-category";
  select.setAttribute("aria-label", "카테고리 수정");
  for (const [value, label] of Object.entries(CATEGORY_LABELS)) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    option.selected = value === todo.category;
    select.append(option);
  }

  li.append(
    input,
    select,
    createButton("save", "저장", "수정 저장", "btn-edit"),
    createButton("cancel", "취소", "수정 취소", "btn-cancel")
  );
  return li;
}

// DOM을 건드리지 않고 숫자만 계산한다. 필터와 무관하게 항상 전체 기준이다.
function getProgress() {
  const total = todos.length;
  const done = todos.filter((t) => t.done).length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  const byCategory = Object.keys(CATEGORY_LABELS).map((name) => {
    const items = todos.filter((t) => t.category === name);
    return { name, total: items.length, done: items.filter((t) => t.done).length };
  });
  return { total, done, percent, byCategory };
}

function renderProgress() {
  const { total, done, percent, byCategory } = getProgress();

  const title = document.createElement("span");
  title.textContent = "전체 진행률";
  const count = document.createElement("span");
  count.className = "progress-count";
  count.textContent = done + " / " + total + " (" + percent + "%)";
  const head = document.createElement("div");
  head.className = "progress-head";
  head.append(title, count);

  const fill = document.createElement("div");
  fill.className = "progress-fill";
  fill.style.width = percent + "%";
  const bar = document.createElement("div");
  bar.className = "progress-bar";
  bar.setAttribute("role", "progressbar");
  bar.setAttribute("aria-label", "전체 진행률");
  bar.setAttribute("aria-valuemin", "0");
  bar.setAttribute("aria-valuemax", "100");
  bar.setAttribute("aria-valuenow", String(percent));
  bar.append(fill);

  const categories = document.createElement("p");
  categories.className = "progress-categories";
  categories.textContent = byCategory
    .map((c) => CATEGORY_LABELS[c.name] + " " + c.done + "/" + c.total)
    .join(" · ");

  const children = [head, bar, categories];
  if (total > 0 && done === total) {
    const message = document.createElement("p");
    message.className = "progress-done";
    message.textContent = "오늘 할 일을 모두 끝냈어요 🎉";
    children.push(message);
  }
  progressEl.replaceChildren(...children);
}

function renderFilters() {
  const buttons = FILTERS.map((name) => {
    const count = name === "all" ? todos.length : todos.filter((t) => t.category === name).length;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "filter-tab" + (name === filter ? " active" : "");
    button.dataset.filter = name;
    button.setAttribute("aria-pressed", String(name === filter));
    button.textContent = FILTER_LABELS[name] + " (" + count + ")";
    return button;
  });
  filtersEl.replaceChildren(...buttons);
}

function render() {
  renderProgress();
  renderFilters();
  const visible = getVisibleTodos();
  listEl.replaceChildren(
    ...visible.map((todo) =>
      todo.id === editingId ? createEditItem(todo) : createTodoItem(todo)
    )
  );
  listEl.hidden = visible.length === 0;
  emptyEl.hidden = visible.length > 0;
  emptyEl.textContent =
    todos.length === 0
      ? "아직 할 일이 없어요. 위에서 추가해 보세요."
      : "이 카테고리에는 할 일이 없어요.";
  if (editingId) {
    const input = listEl.querySelector(".edit-text");
    if (input) {
      input.focus();
      input.select();
    }
  }
}

// ---------- 이벤트 ----------
formEl.addEventListener("submit", (event) => {
  event.preventDefault();
  if (addTodo(inputEl.value, categoryEl.value)) {
    inputEl.value = "";
  }
  inputEl.focus();
});

filtersEl.addEventListener("click", (event) => {
  const tab = event.target.closest("button[data-filter]");
  if (tab) setFilter(tab.dataset.filter);
});

listEl.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const li = button.closest("li");
  switch (button.dataset.action) {
    case "delete": deleteTodo(li.dataset.id); break;
    case "edit": startEdit(li.dataset.id); break;
    case "save": commitEdit(li); break;
    case "cancel": cancelEdit(); break;
  }
});

listEl.addEventListener("dblclick", (event) => {
  const text = event.target.closest(".todo-text");
  if (text) startEdit(text.closest("li").dataset.id);
});

listEl.addEventListener("change", (event) => {
  const checkbox = event.target.closest("input[data-action='toggle']");
  if (checkbox) toggleTodo(checkbox.closest("li").dataset.id);
});

listEl.addEventListener("keydown", (event) => {
  const li = event.target.closest("li.editing");
  if (!li || event.isComposing) return;
  if (event.key === "Enter") {
    event.preventDefault();
    commitEdit(li);
  } else if (event.key === "Escape") {
    cancelEdit();
  }
});

// 수정 중인 항목 밖으로 포커스가 나가면 저장한다. 같은 항목 안(입력창 ↔ 카테고리 ↔ 버튼) 이동은 무시한다.
listEl.addEventListener("focusout", (event) => {
  if (editingId === null) return;
  const li = event.target.closest("li.editing");
  if (!li || li.contains(event.relatedTarget)) return;
  commitEdit(li);
});

// ---------- 시작 ----------
function init() {
  todos = loadTodos();
  filter = loadFilter();
  render();
}

init();
