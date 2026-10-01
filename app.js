// 작성일시: 2026-10-01 11:29 (KST)

const STORAGE_KEY = "todos";
const CATEGORY_LABELS = { work: "업무", personal: "개인", study: "공부" };

// ---------- 상태 ----------
let todos = [];
let filter = "all";

// ---------- DOM ----------
const warningEl = document.getElementById("storage-warning");
const formEl = document.getElementById("add-form");
const inputEl = document.getElementById("todo-input");
const categoryEl = document.getElementById("category-select");
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

function updateTodo() {}

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

// ---------- 렌더링 ----------
function createTodoItem(todo) {
  const li = document.createElement("li");
  li.className = "todo-item" + (todo.done ? " done" : "");
  li.dataset.id = todo.id;

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.id = "todo-" + todo.id;
  checkbox.checked = todo.done;
  checkbox.dataset.action = "toggle";

  const label = document.createElement("label");
  label.className = "todo-text";
  label.htmlFor = checkbox.id;
  label.textContent = todo.text;

  const badge = document.createElement("span");
  badge.className = "badge badge-" + todo.category;
  badge.textContent = CATEGORY_LABELS[todo.category] || todo.category;

  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "btn-small btn-delete";
  deleteBtn.dataset.action = "delete";
  deleteBtn.textContent = "삭제";
  deleteBtn.setAttribute("aria-label", "삭제: " + todo.text);

  li.append(checkbox, label, badge, deleteBtn);
  return li;
}

function render() {
  listEl.replaceChildren(...todos.map(createTodoItem));
}

// ---------- 이벤트 ----------
formEl.addEventListener("submit", (event) => {
  event.preventDefault();
  if (addTodo(inputEl.value, categoryEl.value)) {
    inputEl.value = "";
  }
  inputEl.focus();
});

listEl.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const id = button.closest("li").dataset.id;
  if (button.dataset.action === "delete") deleteTodo(id);
});

listEl.addEventListener("change", (event) => {
  const checkbox = event.target.closest("input[data-action='toggle']");
  if (!checkbox) return;
  toggleTodo(checkbox.closest("li").dataset.id);
});

// ---------- 시작 ----------
function init() {
  todos = loadTodos();
  render();
}

init();
