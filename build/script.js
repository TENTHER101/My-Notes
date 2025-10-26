// Register service worker
// Service Worker registration and update handling
async function registerSW() {
    if (!('serviceWorker' in navigator)) return;
    try {
        const base = location.hostname === 'TENTHER101.github.io' ? '/My-Notes' : '';
        const reg = await navigator.serviceWorker.register(`${base}/sw.js`, { scope: base + '/' });

        // If there's an update waiting, show the banner
        if (reg.waiting) {
            showUpdateBanner();
        }

        // Listen for updates found
        reg.addEventListener('updatefound', () => {
            const newSW = reg.installing;
            if (!newSW) return;
            newSW.addEventListener('statechange', () => {
                if (newSW.state === 'installed') {
                    // New worker installed (may be waiting)
                    showUpdateBanner();
                }
            });
        });

        // Listen for controllerchange to auto-reload when new SW takes control
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            window.location.reload();
        });

        // Listen for messages from SW
        navigator.serviceWorker.addEventListener('message', (ev) => {
            const data = ev.data || {};
            if (data.type === 'SW_INSTALLED') {
                // installed but waiting
                showUpdateBanner();
                showToast('New version available', 'bg-blue-500');
            }
            if (data.type === 'SW_ACTIVATED') {
                // new SW active
                showToast('App updated to latest version!', 'bg-green-500');
            }
        });
    } catch (err) {
        console.warn('SW registration failed', err);
    }
}
registerSW();

// Create and show a small in-app update banner
function showUpdateBanner() {
    if (document.getElementById('sw-update-banner')) return;
    const banner = document.createElement('div');
    banner.id = 'sw-update-banner';
    banner.style = 'position:fixed;left:16px;right:16px;bottom:20px;z-index:60;padding:12px 16px;background:#111;color:#fff;border-radius:8px;display:flex;justify-content:space-between;align-items:center;gap:12px;';
    banner.innerHTML = `<div>New version available</div>`;
    const btn = document.createElement('button');
    btn.textContent = 'Refresh';
    btn.style = 'background:#fff;color:#111;padding:8px 12px;border-radius:6px;border:none;cursor:pointer;';
    btn.addEventListener('click', async () => {
        const reg = await navigator.serviceWorker.getRegistration();
        if (!reg) return window.location.reload();
        if (reg.waiting) {
            // Send skipWaiting message to waiting SW, so it will activate
            reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        } else {
            window.location.reload();
        }
    });
    banner.appendChild(btn);
    document.body.appendChild(banner);
}

// Utilities
const qs = id => document.getElementById(id);
const getNotes = () => JSON.parse(localStorage.getItem('notes') || '[]');
const saveNotes = notes => localStorage.setItem('notes', JSON.stringify(notes));
const escapeText = s => String(s || '').trim();
const nowISO = () => new Date().toISOString();

// Show a toast notification
function showToast(message, bgColor = 'bg-gray-800') {
    const toast = document.createElement('div');
    toast.className = `${bgColor} text-white px-6 py-3 rounded-lg shadow-lg transition-opacity duration-300`;
    toast.textContent = message;
    // Ensure a toast container exists (create if missing)
    let container = qs('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        // Tailwind utility classes for positioning; harmless if Tailwind not loaded
        container.className = 'fixed bottom-6 right-6 z-50 flex flex-col gap-2';
        document.body.appendChild(container);
    }
    container.appendChild(toast);
    
    // Fade in
    requestAnimationFrame(() => {
        toast.style.opacity = '1';
    });
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// DOM elements
const noteTitle = qs('note-title');
const noteContent = qs('note-content');
const addNoteBtn = qs('add-note');
const cancelEditBtn = qs('cancel-edit');
const notesContainer = qs('notes-container');

// View modal elements
const viewModal = qs('view-modal');
const viewTitle = qs('view-title');
const viewContent = qs('view-content');
const viewCreated = qs('view-created');
const viewUpdated = qs('view-updated');
const viewClose = qs('view-close');
const viewClose2 = qs('view-close-2');

let editingIndex = -1; // -1 = not editing

// Render notes (uses DOM APIs to avoid injecting HTML)
function renderNotes() {
    const notes = getNotes();
    notesContainer.innerHTML = '';
    notes.forEach((note, idx) => {
        const card = document.createElement('div');
        card.className = 'bg-gray-200 p-4 rounded-lg mb-2 flex justify-between items-center';

        const content = document.createElement('div');
        const h3 = document.createElement('h3');
        h3.className = 'font-bold';
        h3.textContent = escapeText(note.title || '(Untitled)');

        const meta = document.createElement('p');
        meta.className = 'text-sm text-gray-600';
        const created = note.createdAt ? new Date(note.createdAt).toLocaleString() : '—';
        const updated = note.updatedAt ? new Date(note.updatedAt).toLocaleString() : created;
        meta.textContent = `Created: ${created} · Last edited: ${updated}`;

        content.appendChild(h3);
        content.appendChild(meta);

    const actions = document.createElement('div');

    const viewBtn = document.createElement('button');
    viewBtn.className = 'text-blue-600 font-semibold mr-3 view-note';
    viewBtn.type = 'button';
    viewBtn.dataset.index = idx;
    viewBtn.textContent = 'View';

    const editBtn = document.createElement('button');
    editBtn.className = 'text-yellow-600 font-semibold mr-3 edit-note';
    editBtn.type = 'button';
    editBtn.dataset.index = idx;
    editBtn.textContent = 'Edit';

    const btn = document.createElement('button');
    btn.className = 'text-red-500 font-bold delete-note';
    btn.type = 'button';
    btn.dataset.index = idx;
    btn.textContent = 'Delete';

    actions.appendChild(viewBtn);
    actions.appendChild(editBtn);
    actions.appendChild(btn);

        card.appendChild(content);
        card.appendChild(actions);
        notesContainer.appendChild(card);
    });
}

// Add note
addNoteBtn.addEventListener('click', () => {
    const title = escapeText(noteTitle.value);
    const content = escapeText(noteContent.value);
    if (!title && !content) return; // don't add empty notes

    const notes = getNotes();
    if (editingIndex >= 0) {
        // Save edit
        const note = notes[editingIndex];
        note.title = title;
        note.content = content;
        note.updatedAt = nowISO();
        saveNotes(notes);
        editingIndex = -1;
        addNoteBtn.textContent = 'Add Note';
        cancelEditBtn.classList.add('hidden');
    } else {
        // New note
        notes.push({ title, content, createdAt: nowISO(), updatedAt: nowISO() });
        saveNotes(notes);
    }

    noteTitle.value = '';
    noteContent.value = '';
    renderNotes();
});

// Delete via event delegation
notesContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('.delete-note');
    if (!btn) return;
    const index = Number(btn.dataset.index);
    if (Number.isFinite(index)) {
        // Confirm deletion
        if (!confirm('Delete this note? This action cannot be undone.')) return;
        const notes = getNotes();
        notes.splice(index, 1);
        saveNotes(notes);
        renderNotes();
    }
});

// Event delegation for view and edit buttons
notesContainer.addEventListener('click', (e) => {
    const viewBtn = e.target.closest('.view-note');
    if (viewBtn) {
        const idx = Number(viewBtn.dataset.index);
        const notes = getNotes();
        const note = notes[idx];
        if (!note) return;
        viewTitle.textContent = note.title || '(Untitled)';
        viewContent.textContent = note.content || '';
        viewCreated.textContent = `Created: ${note.createdAt ? new Date(note.createdAt).toLocaleString() : '—'}`;
        viewUpdated.textContent = `Last edited: ${note.updatedAt ? new Date(note.updatedAt).toLocaleString() : '—'}`;
        viewModal.classList.remove('hidden');
        return;
    }

    const editBtn = e.target.closest('.edit-note');
    if (editBtn) {
        const idx = Number(editBtn.dataset.index);
        const notes = getNotes();
        const note = notes[idx];
        if (!note) return;
        // Populate form for editing
        noteTitle.value = note.title || '';
        noteContent.value = note.content || '';
        editingIndex = idx;
        addNoteBtn.textContent = 'Save Note';
        cancelEditBtn.classList.remove('hidden');
        // focus title
        noteTitle.focus();
        return;
    }
});

// Cancel edit
cancelEditBtn.addEventListener('click', () => {
    editingIndex = -1;
    noteTitle.value = '';
    noteContent.value = '';
    addNoteBtn.textContent = 'Add Note';
    cancelEditBtn.classList.add('hidden');
});

// View modal close handlers
viewClose.addEventListener('click', () => viewModal.classList.add('hidden'));
viewClose2.addEventListener('click', () => viewModal.classList.add('hidden'));

// Accessibility: close on ESC and trap focus inside modal while open
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !viewModal.classList.contains('hidden')) {
        viewModal.classList.add('hidden');
    }
});

// Simple focus trap for modal
viewModal.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const focusable = viewModal.querySelectorAll('button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])');
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
    }
});

// Initial load
document.addEventListener('DOMContentLoaded', renderNotes);
