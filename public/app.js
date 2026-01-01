const todos = [];
let filter = 'all';
let nextId = 1;

const list = document.querySelector('#list');
const count = document.querySelector('#count');
const clear = document.querySelector('#clear-completed');

function visible(todo) {
  if (filter === 'active') return !todo.completed;
  if (filter === 'completed') return todo.completed;
  return true;
}

function render() {
  list.replaceChildren(
    ...todos.filter(visible).map((todo) => {
      const item = document.createElement('li');
      item.classList.toggle('completed', todo.completed);
      const label = document.createElement('label');
      const box = document.createElement('input');
      box.type = 'checkbox';
      box.checked = todo.completed;
      box.addEventListener('change', () => {
        todo.completed = box.checked;
        render();
      });
      const text = document.createElement('span');
      text.textContent = todo.title;
      label.append(box, text);
      item.append(label);
      return item;
    }),
  );
  const left = todos.filter((t) => !t.completed).length;
  count.textContent = `${left} ${left === 1 ? 'item' : 'items'} left`;
  clear.hidden = !todos.some((t) => t.completed);
  for (const button of document.querySelectorAll('[data-filter]')) {
    button.setAttribute('aria-pressed', String(button.dataset.filter === filter));
  }
}

document.querySelector('#new-todo').addEventListener('submit', (event) => {
  event.preventDefault();
  const input = document.querySelector('#title');
  const title = input.value.trim();
  if (!title) return;
  todos.push({ id: nextId++, title, completed: false });
  input.value = '';
  render();
});

for (const button of document.querySelectorAll('[data-filter]')) {
  button.addEventListener('click', () => {
    filter = button.dataset.filter;
    render();
  });
}

clear.addEventListener('click', () => {
  for (let i = todos.length - 1; i >= 0; i -= 1) if (todos[i].completed) todos.splice(i, 1);
  render();
});

render();
