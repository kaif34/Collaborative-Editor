const socket = io('http://localhost:3000');
const editor = document.getElementById('editor');
const connectionStatus = document.getElementById('connection-status');
const userCount = document.getElementById('user-count');
const activeUsers = document.getElementById('active-users');
const cursorsContainer = document.getElementById('cursors-container');
const saveButton = document.getElementById('save-button');

let lastCursorPosition = { x: 0, y: 0 };
let debounceTimeout;
let connectedUsers = new Set();

// Connection handling
socket.on('connect', () => {
    connectionStatus.textContent = 'Connected';
    connectionStatus.classList.add('connected');
});

socket.on('disconnect', () => {
    connectionStatus.textContent = 'Disconnected';
    connectionStatus.classList.remove('connected');
});

// Text change handling
editor.addEventListener('input', (e) => {
    const content = e.target.value;
    socket.emit('text-change', content);
});

socket.on('text-change', (content) => {
    if (editor.value !== content) {
        editor.value = content;
    }
});

// Save handling
saveButton.addEventListener('click', () => {
    const content = editor.value;
    socket.emit('save-document', content);
});

socket.on('save-success', () => {
    // Show save success notification
    const notification = document.createElement('div');
    notification.className = 'notification success';
    notification.textContent = 'Document saved successfully';
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
});

socket.on('save-error', (error) => {
    // Show save error notification
    const notification = document.createElement('div');
    notification.className = 'notification error';
    notification.textContent = `Error saving document: ${error}`;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
});

// Cursor position handling
editor.addEventListener('mousemove', (e) => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
        const rect = editor.getBoundingClientRect();
        const position = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
        
        if (position.x !== lastCursorPosition.x || position.y !== lastCursorPosition.y) {
            socket.emit('cursor-move', position);
            lastCursorPosition = position;
        }
    }, 50);
});

socket.on('cursor-move', (data) => {
    updateCursor(data.userId, data.position);
});

// User tracking
socket.on('user-connected', (userId) => {
    connectedUsers.add(userId);
    updateUserInterface();
});

socket.on('user-disconnected', (userId) => {
    connectedUsers.delete(userId);
    removeCursor(userId);
    updateUserInterface();
});

function updateCursor(userId, position) {
    let cursor = document.getElementById(`cursor-${userId}`);
    
    if (!cursor) {
        cursor = document.createElement('div');
        cursor.id = `cursor-${userId}`;
        cursor.className = 'cursor';
        cursor.setAttribute('data-user', `User ${userId.slice(0, 4)}`);
        cursorsContainer.appendChild(cursor);
    }

    cursor.style.left = `${position.x}px`;
    cursor.style.top = `${position.y}px`;
}

function removeCursor(userId) {
    const cursor = document.getElementById(`cursor-${userId}`);
    if (cursor) {
        cursor.remove();
    }
}

function updateUserInterface() {
    userCount.textContent = `Users: ${connectedUsers.size}`;
    
    activeUsers.innerHTML = '';
    connectedUsers.forEach(userId => {
        const userBadge = document.createElement('div');
        userBadge.className = 'user-badge';
        userBadge.textContent = `User ${userId.slice(0, 4)}`;
        activeUsers.appendChild(userBadge);
    });
}