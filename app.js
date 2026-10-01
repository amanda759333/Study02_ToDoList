// 작성일시: 2026-10-01 11:29 (KST)

const STORAGE_KEY = "todos";
const CATEGORIES = ["work", "personal", "study"];

// ---------- 상태 ----------
let todos = [];
let filter = "all";

// ---------- 저장 ----------
function showStorageWarning() {
  document.getElementById("storage-warning").hidden = false;
}

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
    showStorageWarning();
  }
}

// ---------- 액션 ----------
function addTodo() {}
function updateTodo() {}
function deleteTodo() {}
function toggleTodo() {}

// ---------- 렌더링 ----------
function render() {}

// ---------- 시작 ----------
function init() {
  todos = loadTodos();
  render();
}

init();
