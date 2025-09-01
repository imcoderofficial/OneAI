// renderer.js - handles UI interactions for OneAI index page

function el(id) { return document.getElementById(id); }

async function refreshList() {
  showLoader('Loading entries...');
  const list = await window.oneai.getAll();
  const container = el('right-list');
  container.innerHTML = '';
  if (!list || list.length === 0) {
    container.innerHTML = '<p class="muted">No AI entries yet.</p>';
    hideLoader();
    return;
  }
  list.forEach(item => {
    const div = document.createElement('div');
    div.className = 'item';
    div.dataset.search = (item.label + ' ' + item.website).toLowerCase();
    div.innerHTML = `
      <strong>${escapeHtml(item.label)}</strong>
      <div class="small muted">${escapeHtml(item.website)}</div>
      <div class="actions mt-2 d-flex gap-2">
        <button data-id="${item.id}" class="edit">Edit</button>
        <button data-id="${item.id}" class="delete">Delete</button>
      </div>
    `;
    container.appendChild(div);
  });
  hideLoader();
}

function escapeHtml(s){
  if (!s) return '';
  return s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
}

function showLoader(text){
  const o = document.getElementById('loader-overlay');
  if (!o) return;
  const t = o.querySelector('.loader-text');
  if (t && text) t.innerText = text;
  o.classList.add('visible');
}

function hideLoader(){
  const o = document.getElementById('loader-overlay');
  if (!o) return;
  o.classList.remove('visible');
}

function clearForm(){
  el('ai-id').value = '';
  el('ai-label').value = '';
  el('ai-website').value = '';
  el('save-btn').innerText = 'Add AI';
}

async function onSave(e){
  e.preventDefault();
  const id = el('ai-id').value;
  const label = el('ai-label').value.trim();
  const website = el('ai-website').value.trim();
  if (!label || !website) return alert('Please provide both Label and Website');
  if (id) {
    const updated = { id, label, website };
    showLoader('Updating entry...');
    const res = await window.oneai.update(updated);
    hideLoader();
    if (res) {
      clearForm();
      refreshList();
    }
  } else {
    showLoader('Adding entry...');
    const res = await window.oneai.create({ label, website });
    hideLoader();
    if (res) {
      clearForm();
      refreshList();
    }
  }
}

async function onListClick(e){
  // ...existing code...
  if (e.target.matches('button.edit')){
    const id = e.target.dataset.id;
    const list = await window.oneai.getAll();
    const item = list.find(x=>x.id===id);
    if (!item) return;
    el('ai-id').value = item.id;
    el('ai-label').value = item.label;
    el('ai-website').value = item.website;
    el('save-btn').innerText = 'Update AI';
  }
  if (e.target.matches('button.delete')){
    const id = e.target.dataset.id;
    if (!confirm('Delete this entry?')) return;
  showLoader('Deleting...');
  const ok = await window.oneai.delete(id);
  hideLoader();
  if (ok) refreshList();
  }
}

async function onDeleteAll(){
  if (!confirm('Delete ALL AI entries? This cannot be undone.')) return;
  const ok = await window.oneai.deleteAll();
  if (ok) refreshList();
}

window.addEventListener('DOMContentLoaded', () => {
  el('form-ai').addEventListener('submit', onSave);
  el('right-list').addEventListener('click', onListClick);
  el('clear-btn').addEventListener('click', clearForm);
  const deleteAllBtn = document.getElementById('delete-all-btn');
  if (deleteAllBtn) deleteAllBtn.addEventListener('click', onDeleteAll);
  showLoader('Loading entries...');
  refreshList();
});
