const STORAGE_KEY = "focusflow.tasks.v1";
const taskForm = document.querySelector("#taskForm");
const taskInput = document.querySelector("#taskInput");
const priorityInput = document.querySelector("#priorityInput");
const taskList = document.querySelector("#taskList");
const emptyState = document.querySelector("#emptyState");
const formMessage = document.querySelector("#formMessage");
const searchInput = document.querySelector("#searchInput");
const clearCompletedButton = document.querySelector("#clearCompleted");
const filterButtons = [...document.querySelectorAll(".filter")];

let tasks = loadTasks();
let currentFilter = "all";

function loadTasks() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(saved) ? saved.filter(t => t && typeof t.id === "string" && typeof t.title === "string") : [];
  } catch (error) {
    console.warn("Could not read saved tasks:", error);
    return [];
  }
}

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (error) {
    formMessage.textContent = "Your browser could not save changes. Check storage settings.";
    console.error("Could not save tasks:", error);
  }
}

function addTask(title, priority) {
  tasks.unshift({ id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()), title, priority, completed: false });
  saveTasks();
  render();
}

function visibleTasks() {
  const query = searchInput.value.trim().toLowerCase();
  return tasks.filter(task => {
    const matchesFilter = currentFilter === "all" ||
      (currentFilter === "active" && !task.completed) ||
      (currentFilter === "completed" && task.completed);
    return matchesFilter && task.title.toLowerCase().includes(query);
  });
}

function render() {
  taskList.replaceChildren();
  const shown = visibleTasks();
  emptyState.hidden = shown.length > 0;
  emptyState.querySelector("h3").textContent = tasks.length === 0 ? "Nothing on your list yet" :
    (shown.length === 0 ? "No matching tasks" : "Nothing on your list yet");
  emptyState.querySelector("p").textContent = tasks.length === 0 ?
    "Add a task above and turn your plans into progress." : "Try another filter or search term.";

  shown.forEach(task => {
    const item = document.createElement("li");
    item.className = `task-item${task.completed ? " done" : ""}`;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "task-check";
    checkbox.checked = task.completed;
    checkbox.setAttribute("aria-label", `Mark ${task.title} ${task.completed ? "active" : "completed"}`);
    checkbox.addEventListener("change", () => {
      task.completed = checkbox.checked;
      saveTasks();
      render();
    });

    const main = document.createElement("div");
    main.className = "task-main";
    const title = document.createElement("span");
    title.className = "task-title";
    title.textContent = task.title;
    main.append(title);

    const priority = document.createElement("span");
    priority.className = `priority ${task.priority}`;
    priority.textContent = task.priority;

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "delete-button";
    remove.textContent = "×";
    remove.setAttribute("aria-label", `Delete ${task.title}`);
    remove.addEventListener("click", () => {
      tasks = tasks.filter(t => t.id !== task.id);
      saveTasks();
      render();
    });

    item.append(checkbox, main, priority, remove);
    taskList.append(item);
  });

  const completed = tasks.filter(t => t.completed).length;
  const percent = tasks.length ? Math.round(completed / tasks.length * 100) : 0;
  document.querySelector("#progressPercent").textContent = `${percent}%`;
  document.querySelector("#progressText").textContent = `${completed} of ${tasks.length} completed`;
  document.querySelector("#progressBar").style.width = `${percent}%`;
  document.querySelector("#taskCount").textContent = `${tasks.length} ${tasks.length === 1 ? "task" : "tasks"}`;
  document.querySelector("#remainingText").textContent = `${tasks.length - completed} tasks remaining`;
  clearCompletedButton.disabled = completed === 0;
  clearCompletedButton.style.opacity = completed === 0 ? ".45" : "1";
}

taskForm.addEventListener("submit", event => {
  event.preventDefault();
  const title = taskInput.value.trim();
  if (!title) {
    formMessage.textContent = "Please enter a task before adding it.";
    taskInput.focus();
    return;
  }
  if (tasks.some(t => t.title.toLowerCase() === title.toLowerCase() && !t.completed)) {
    formMessage.textContent = "That active task is already on your list.";
    taskInput.focus();
    return;
  }
  formMessage.textContent = "";
  addTask(title, priorityInput.value);
  taskInput.value = "";
  taskInput.focus();
});

filterButtons.forEach(button => button.addEventListener("click", () => {
  currentFilter = button.dataset.filter;
  filterButtons.forEach(b => b.classList.toggle("active", b === button));
  render();
}));

searchInput.addEventListener("input", render);
clearCompletedButton.addEventListener("click", () => {
  tasks = tasks.filter(task => !task.completed);
  saveTasks();
  render();
});

document.querySelector("#todayLabel").textContent = new Intl.DateTimeFormat("en", {
  weekday: "short", month: "short", day: "numeric", year: "numeric"
}).format(new Date());

render();