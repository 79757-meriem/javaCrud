const grid = document.querySelector("#notes-grid");
const count = document.querySelector("#note-count");
const totalLabel = document.querySelector("#total-label");
const search = document.querySelector("#search");
const statusMessage = document.querySelector("#status");
const dialog = document.querySelector("#note-dialog");
const form = document.querySelector("#note-form");
const titleInput = document.querySelector("#note-title");
const contentInput = document.querySelector("#note-content");
const dialogKicker = document.querySelector("#dialog-kicker");

let notes = [];
let editingId = null;

function escapeHtml(value = "") {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}

function formatDate(value) {
  if (!value) return "JUST NOW";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(value));
}

function showStatus(message) {
  statusMessage.textContent = message;
  statusMessage.hidden = false;
}

function clearStatus() {
  statusMessage.hidden = true;
  statusMessage.textContent = "";
}

async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers }
  });
  if (!response.ok) {
    let message = `Something went wrong (${response.status}). Please try again.`;
    try {
      const body = await response.json();
      message = body.detail || body.message || message;
    } catch {
      // Keep the HTTP status message when the response has no JSON body.
    }
    throw new Error(message);
  }
  return response.status === 204 ? null : response.json();
}

function renderNotes() {
  const query = search.value.trim().toLowerCase();
  const visibleNotes = notes.filter((note) => `${note.title} ${note.content}`.toLowerCase().includes(query));
  count.textContent = notes.length;
  totalLabel.textContent = `${notes.length} ${notes.length === 1 ? "note" : "notes"}`;

  if (!visibleNotes.length) {
    const searching = query.length > 0;
    grid.innerHTML = `<div class="empty-state"><div class="empty-illustration">${searching ? "⌕" : "✳"}</div><h3>${searching ? "No notes found" : "Your page is still blank."}</h3><p>${searching ? "Try another search, or clear it to see all your notes." : "Every good idea starts somewhere. Save a thought and it will find a home here."}</p></div>`;
    return;
  }

  grid.innerHTML = visibleNotes.map((note) => `
    <article class="note-card" data-id="${note.id}">
      <div class="card-top"><span class="card-dot"></span><div class="card-actions">
        <button class="card-action edit" type="button" aria-label="Edit ${escapeHtml(note.title)}" title="Edit">↗</button>
        <button class="card-action delete" type="button" aria-label="Delete ${escapeHtml(note.title)}" title="Delete">×</button>
      </div></div>
      <h3>${escapeHtml(note.title)}</h3>
      <p>${escapeHtml(note.content || "No additional details.")}</p>
      <div class="card-footer"><span>UPDATED ${escapeHtml(formatDate(note.updatedAt))}</span><span class="card-tag">PERSONAL</span></div>
    </article>`).join("");
}

async function loadNotes() {
  try {
    notes = await request("/api/notes");
    renderNotes();
  } catch (error) {
    showStatus(`Couldn't load your notes. ${error.message}`);
    grid.innerHTML = "";
  }
}

function openCreateDialog() {
  editingId = null;
  form.reset();
  dialogKicker.textContent = "A NEW THOUGHT";
  dialog.showModal();
  titleInput.focus();
}

function openEditDialog(note) {
  editingId = note.id;
  titleInput.value = note.title;
  contentInput.value = note.content;
  dialogKicker.textContent = "A THOUGHT TO KEEP";
  dialog.showModal();
  titleInput.focus();
}

document.querySelector("#new-note").addEventListener("click", openCreateDialog);
document.querySelector("#close-dialog").addEventListener("click", () => dialog.close());
document.querySelector("#cancel-note").addEventListener("click", () => dialog.close());
search.addEventListener("input", renderNotes);
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = { title: titleInput.value.trim(), content: contentInput.value };
  if (!payload.title) {
    titleInput.focus();
    return;
  }

  const saveButton = form.querySelector(".save-button");
  saveButton.disabled = true;
  clearStatus();
  try {
    const saved = await request(editingId ? `/api/notes/${editingId}` : "/api/notes", {
      method: editingId ? "PUT" : "POST",
      body: JSON.stringify(payload)
    });
    if (editingId) notes = notes.map((note) => note.id === editingId ? saved : note);
    else notes.unshift(saved);
    notes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    renderNotes();
    dialog.close();
  } catch (error) {
    showStatus(`Couldn't save your note. ${error.message}`);
  } finally {
    saveButton.disabled = false;
  }
});

grid.addEventListener("click", async (event) => {
  const card = event.target.closest(".note-card");
  if (!card) return;
  const note = notes.find((item) => String(item.id) === card.dataset.id);
  if (!note) return;
  if (event.target.closest(".edit")) {
    openEditDialog(note);
    return;
  }
  if (event.target.closest(".delete")) {
    if (!window.confirm(`Delete “${note.title}”? This can't be undone.`)) return;
    clearStatus();
    try {
      await request(`/api/notes/${note.id}`, { method: "DELETE" });
      notes = notes.filter((item) => item.id !== note.id);
      renderNotes();
    } catch (error) {
      showStatus(`Couldn't delete your note. ${error.message}`);
    }
  }
});

loadNotes();
