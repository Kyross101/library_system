// =============================================
// LIBRARY MANAGEMENT SYSTEM - UPGRADED v2.0
// =============================================

let booksArray = [];
let booksMap = {};
let waitingQueue = {};
let returnStack = [];

// LOCAL STORAGE
function saveToStorage() {
    localStorage.setItem('lms_books', JSON.stringify(booksArray));
    localStorage.setItem('lms_booksMap', JSON.stringify(booksMap));
    localStorage.setItem('lms_queue', JSON.stringify(waitingQueue));
    localStorage.setItem('lms_stack', JSON.stringify(returnStack));
}

function loadFromStorage() {
    const books = localStorage.getItem('lms_books');
    const map = localStorage.getItem('lms_booksMap');
    const queue = localStorage.getItem('lms_queue');
    const stack = localStorage.getItem('lms_stack');
    if (books) booksArray = JSON.parse(books);
    if (map) booksMap = JSON.parse(map);
    if (queue) waitingQueue = JSON.parse(queue);
    if (stack) returnStack = JSON.parse(stack);
}

// TOAST
function showtoast(message, type = "success") {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.classList.add("toast", type);
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
}

// SECTION NAV
function showSection(sectionId) {
    ['dashboard','books','queue','stack'].forEach(id => {
        document.getElementById(id).classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');
    updateStats();
    document.querySelectorAll('.sidebar button').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(sectionId)) {
            btn.classList.add('active');
        }
    });
}

// ADD BOOK
function addBook() {
    let id = document.getElementById("bookId").value.trim();
    let title = document.getElementById("bookTitle").value.trim();
    let author = document.getElementById("bookAuthor").value.trim();
    let genre = document.getElementById("bookGenre").value.trim();

    if (!id || !title || !author || !genre) {
        showtoast("Please fill in all fields (ID, Title, Author, Genre)", "error");
        return;
    }
    if (booksMap[id]) {
        showtoast("Book ID already exists!", "error");
        return;
    }

    let book = { id, title, author, genre, available: true, borrowedBy: null, borrowDate: null, dueDate: null };
    booksArray.push(book);
    booksMap[id] = book;

    document.getElementById("bookId").value = '';
    document.getElementById("bookTitle").value = '';
    document.getElementById("bookAuthor").value = '';
    document.getElementById("bookGenre").value = '';

    saveToStorage();
    showtoast("Book added successfully!");
    displayBooks();
    updateStats();
}

// SEARCH BOOK
function searchBook() {
    let id = document.getElementById("bookId").value.trim();
    let book = booksMap[id];
    if (!book) { showtoast("Book not found.", "error"); return; }
    let status = book.available ? "Available" : "Borrowed by " + book.borrowedBy;
    let dueInfo = book.dueDate ? " | Due: " + book.dueDate : '';
    showtoast('"' + book.title + '" by ' + book.author + ' | ' + book.genre + ' | ' + status + dueInfo);
}

// BORROW BOOK
function borrowBook() {
    let id = document.getElementById("borrowId").value.trim();
    let user = document.getElementById("userName").value.trim();
    let dueDateInput = document.getElementById("dueDate").value;

    if (!id || !user) { showtoast("Please enter Book ID and your name.", "error"); return; }
    if (!dueDateInput) { showtoast("Please set a due date.", "error"); return; }

    let book = booksMap[id];
    if (!book) { showtoast("Book not found.", "error"); return; }

    if (book.available) {
        book.available = false;
        book.borrowedBy = user;
        book.borrowDate = new Date().toLocaleDateString();
        book.dueDate = dueDateInput;
        saveToStorage();
        showtoast(user + ' borrowed "' + book.title + '" | Due: ' + dueDateInput);
    } else {
        if (!waitingQueue[id]) waitingQueue[id] = [];
        waitingQueue[id].push({ user, requestDate: new Date().toLocaleDateString() });
        saveToStorage();
        showtoast("Book unavailable. " + user + " added to waiting list.", "warn");
    }
    displayBooks(); displayQueue(); updateStats();
}

// RETURN BOOK
function returnBook() {
    let id = document.getElementById("borrowId").value.trim();
    let book = booksMap[id];
    if (!book) { showtoast("Book not found.", "error"); return; }
    if (book.available) { showtoast("This book is not currently borrowed.", "warn"); return; }

    checkOverdue(book);

    returnStack.push({ id: book.id, title: book.title, author: book.author, returnedBy: book.borrowedBy, returnDate: new Date().toLocaleDateString() });

    if (waitingQueue[id] && waitingQueue[id].length > 0) {
        let next = waitingQueue[id].shift();
        book.borrowedBy = next.user;
        book.borrowDate = new Date().toLocaleDateString();
        book.available = false;
        showtoast("Book returned and auto-assigned to " + next.user + " in queue!");
    } else {
        book.available = true;
        book.borrowedBy = null;
        book.borrowDate = null;
        book.dueDate = null;
        showtoast("Book returned successfully!");
    }
    saveToStorage();
    displayBooks(); displayQueue(); displayStack(); updateStats();
}

// OVERDUE
function isOverdue(book) {
    if (book.available || !book.dueDate) return false;
    return new Date() > new Date(book.dueDate);
}

function checkOverdue(book) {
    if (!book.dueDate) return;
    const today = new Date();
    const due = new Date(book.dueDate);
    if (today > due) {
        const daysLate = Math.floor((today - due) / (1000 * 60 * 60 * 24));
        const fine = daysLate * 5;
        showtoast("OVERDUE! " + daysLate + " day(s) late. Fine: P" + fine, "error");
    }
}

function checkAllOverdue() {
    let overdueBooks = booksArray.filter(b => isOverdue(b));
    if (overdueBooks.length === 0) {
        showtoast("No overdue books!", "success");
    } else {
        overdueBooks.forEach(b => {
            const daysLate = Math.floor((new Date() - new Date(b.dueDate)) / (1000 * 60 * 60 * 24));
            showtoast('OVERDUE: "' + b.title + '" by ' + b.borrowedBy + ' - ' + daysLate + ' day(s) | Fine: P' + (daysLate * 5), "error");
        });
    }
}

// DELETE BOOK
function deleteBook(id) {
    const book = booksMap[id];
    if (!book) return;
    if (!book.available) { showtoast('Cannot delete - "' + book.title + '" is currently borrowed!', "error"); return; }
    if (!confirm('Are you sure you want to delete "' + book.title + '"?')) return;
    booksArray = booksArray.filter(b => b.id !== id);
    delete booksMap[id];
    delete waitingQueue[id];
    saveToStorage();
    showtoast('"' + book.title + '" deleted successfully.', "warn");
    displayBooks();
    updateStats();
}

// EDIT BOOK
function editBook(id) {
    const book = booksMap[id];
    if (!book) return;
    document.getElementById('editBookId').value = book.id;
    document.getElementById('editBookTitle').value = book.title;
    document.getElementById('editBookAuthor').value = book.author;
    document.getElementById('editBookGenre').value = book.genre;
    document.getElementById('editOriginalId').value = book.id;
    document.getElementById('editModal').classList.add('show');
}

function saveEditBook() {
    const originalId = document.getElementById('editOriginalId').value;
    const newTitle = document.getElementById('editBookTitle').value.trim();
    const newAuthor = document.getElementById('editBookAuthor').value.trim();
    const newGenre = document.getElementById('editBookGenre').value.trim();
    if (!newTitle || !newAuthor || !newGenre) { showtoast("Please fill in all fields.", "error"); return; }
    const book = booksMap[originalId];
    book.title = newTitle;
    book.author = newAuthor;
    book.genre = newGenre;
    saveToStorage();
    closeEditModal();
    showtoast('"' + newTitle + '" updated successfully!');
    displayBooks();
}

function closeEditModal() {
    document.getElementById('editModal').classList.remove('show');
}

// DISPLAY BOOKS
function buildBookListItem(book) {
    const overdue = isOverdue(book);
    let statusHtml = book.available
        ? '<span class="badge available">Available</span>'
        : '<span class="badge borrowed' + (overdue ? ' overdue' : '') + '">' + (overdue ? 'OVERDUE' : 'Borrowed') + ' by ' + book.borrowedBy + (book.dueDate ? ' | Due: ' + book.dueDate : '') + '</span>';

    return '<li class="' + (overdue ? 'overdue-item' : '') + '">' +
        '<div class="book-info">' +
        '<strong>' + book.id + '</strong> — ' + book.title +
        '<span class="book-meta">by ' + book.author + ' &nbsp;|&nbsp; ' + book.genre + '</span>' +
        '</div>' +
        '<div class="book-actions">' +
        statusHtml +
        '<button class="btn-edit" onclick="editBook(\'' + book.id + '\')">Edit</button>' +
        '<button class="btn-delete" onclick="deleteBook(\'' + book.id + '\')">Delete</button>' +
        '</div></li>';
}

function displayBooks() {
    const list = document.getElementById("bookList");
    list.innerHTML = "";
    if (booksArray.length === 0) {
        list.innerHTML = '<li class="empty-state">No books in the library yet. Add one above!</li>';
        return;
    }
    booksArray.forEach(book => { list.innerHTML += buildBookListItem(book); });
}

function filterBooks() {
    const searchValue = document.getElementById('searchBookInput').value.toLowerCase();
    const genreEl = document.getElementById('genreFilter');
    const genre = genreEl ? genreEl.value.toLowerCase() : '';
    const list = document.getElementById('bookList');
    list.innerHTML = "";
    const filtered = booksArray.filter(book => {
        const matchSearch = (book.id + book.title + book.author).toLowerCase().includes(searchValue);
        const matchGenre = !genre || book.genre.toLowerCase() === genre;
        return matchSearch && matchGenre;
    });
    if (filtered.length === 0) { list.innerHTML = '<li class="empty-state">No books match your search.</li>'; return; }
    filtered.forEach(book => { list.innerHTML += buildBookListItem(book); });
}

// DISPLAY QUEUE
function displayQueue() {
    const list = document.getElementById("queueList");
    list.innerHTML = "";
    let hasItems = false;
    for (let bookId in waitingQueue) {
        if (waitingQueue[bookId].length > 0) {
            hasItems = true;
            const bookTitle = booksMap[bookId] ? booksMap[bookId].title : bookId;
            waitingQueue[bookId].forEach((entry, index) => {
                list.innerHTML += '<li><strong>' + bookTitle + '</strong> (ID: ' + bookId + ')' +
                    '<span class="book-meta">' + entry.user + ' | Position #' + (index + 1) + ' | Requested: ' + entry.requestDate + '</span></li>';
            });
        }
    }
    if (!hasItems) list.innerHTML = '<li class="empty-state">No one in the waiting list!</li>';
}

function filterQueue() {
    const searchValue = document.getElementById('searchQueueInput').value.toLowerCase();
    const list = document.getElementById('queueList');
    list.innerHTML = "";
    let hasItems = false;
    for (let bookId in waitingQueue) {
        if (waitingQueue[bookId].length > 0) {
            const bookTitle = booksMap[bookId] ? booksMap[bookId].title : bookId;
            waitingQueue[bookId].forEach((entry, index) => {
                if ((bookId + bookTitle + entry.user).toLowerCase().includes(searchValue)) {
                    hasItems = true;
                    list.innerHTML += '<li><strong>' + bookTitle + '</strong> (ID: ' + bookId + ')' +
                        '<span class="book-meta">' + entry.user + ' | Position #' + (index + 1) + ' | Requested: ' + entry.requestDate + '</span></li>';
                }
            });
        }
    }
    if (!hasItems) list.innerHTML = '<li class="empty-state">No results found.</li>';
    if (searchValue === "") displayQueue();
}

// DISPLAY STACK
function displayStack() {
    const list = document.getElementById("stackList");
    list.innerHTML = "";
    if (returnStack.length === 0) {
        list.innerHTML = '<li class="empty-state">No books have been returned yet.</li>';
        return;
    }
    returnStack.slice().reverse().forEach(record => {
        list.innerHTML += '<li><strong>' + record.id + '</strong> — ' + record.title +
            '<span class="book-meta">by ' + (record.author || '-') + ' | Returned by: ' + (record.returnedBy || '-') + ' | ' + record.returnDate + '</span></li>';
    });
}

function filterStack() {
    const searchValue = document.getElementById('searchStackInput').value.toLowerCase();
    const list = document.getElementById('stackList');
    list.innerHTML = "";
    const filtered = returnStack.slice().reverse().filter(r => (r.id + r.title + (r.returnedBy || '')).toLowerCase().includes(searchValue));
    if (filtered.length === 0) { list.innerHTML = '<li class="empty-state">No results found.</li>'; return; }
    filtered.forEach(record => {
        list.innerHTML += '<li><strong>' + record.id + '</strong> — ' + record.title +
            '<span class="book-meta">by ' + (record.author || '-') + ' | Returned by: ' + (record.returnedBy || '-') + ' | ' + record.returnDate + '</span></li>';
    });
    if (searchValue === "") displayStack();
}

// STATS + ANIMATE
function animateValue(element, start, end, duration) {
    duration = duration || 600;
    let startTime = null;
    function animation(currentTime) {
        if (!startTime) startTime = currentTime;
        const progress = Math.min((currentTime - startTime) / duration, 1);
        element.textContent = Math.floor(progress * (end - start) + start);
        if (progress < 1) requestAnimationFrame(animation);
    }
    requestAnimationFrame(animation);
}

function pulse(card) {
    card.classList.add('pulse');
    setTimeout(function() { card.classList.remove('pulse'); }, 600);
}

function updateStats() {
    const totalEl = document.getElementById('totalBooks');
    const borrowedEl = document.getElementById('borrowedBooks');
    const waitingEl = document.getElementById('waitingCount');
    const availableEl = document.getElementById('availableBooks');
    const overdueEl = document.getElementById('overdueBooks');

    const total = booksArray.length;
    const borrowed = booksArray.filter(function(b) { return !b.available; }).length;
    const available = booksArray.filter(function(b) { return b.available; }).length;
    const waiting = Object.values(waitingQueue).reduce(function(acc, q) { return acc + q.length; }, 0);
    const overdue = booksArray.filter(function(b) { return isOverdue(b); }).length;

    animateValue(totalEl, Number(totalEl.textContent), total);
    animateValue(borrowedEl, Number(borrowedEl.textContent), borrowed);
    animateValue(waitingEl, Number(waitingEl.textContent), waiting);
    animateValue(availableEl, Number(availableEl.textContent), available);
    animateValue(overdueEl, Number(overdueEl.textContent), overdue);

    document.querySelectorAll('.stat-card').forEach(function(card) { pulse(card); });
}

// DEFAULT DUE DATE
function setDefaultDueDate() {
    const d = document.getElementById('dueDate');
    if (d) {
        const today = new Date();
        d.min = today.toISOString().split('T')[0];
        const due = new Date();
        due.setDate(due.getDate() + 14);
        d.value = due.toISOString().split('T')[0];
    }
}

// INIT
window.addEventListener('load', function() {
    loadFromStorage();
    setDefaultDueDate();
    displayBooks();
    displayQueue();
    displayStack();
    updateStats();
    showSection('dashboard');
});

// =============================================
// GLOBAL BOOK SEARCH — Google Books API
// =============================================
async function globalSearchBooks() {
    const query = document.getElementById('globalSearchInput').value.trim();
    if (!query) { showtoast("Please enter a book title or author to search.", "warn"); return; }

    const btn = document.getElementById('globalSearchBtn');
    btn.textContent = 'Searching...';
    btn.disabled = true;

    const resultsPanel = document.getElementById('globalSearchResults');
    const resultsGrid = document.getElementById('resultsGrid');
    const resultsTitle = document.getElementById('resultsTitle');

    resultsGrid.innerHTML = '<div class="results-loading">🔄 Fetching books from Google Books...</div>';
    resultsPanel.style.display = 'block';
    resultsPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    try {
        const url = 'https://www.googleapis.com/books/v1/volumes?q=' + encodeURIComponent(query) + '&maxResults=12&langRestrict=en';
        const res = await fetch(url);
        const data = await res.json();

        btn.textContent = 'Search';
        btn.disabled = false;

        if (!data.items || data.items.length === 0) {
            resultsGrid.innerHTML = '<div class="results-loading">😔 No books found. Try a different search.</div>';
            resultsTitle.textContent = 'No results for "' + query + '"';
            return;
        }

        resultsTitle.textContent = 'Results for "' + query + '" (' + data.items.length + ' found)';
        resultsGrid.innerHTML = '';

        data.items.forEach(function(item) {
            const info = item.volumeInfo;
            const title = info.title || 'Unknown Title';
            const authors = info.authors ? info.authors.join(', ') : 'Unknown Author';
            const genre = info.categories ? info.categories[0] : 'General';
            const cover = info.imageLinks ? info.imageLinks.thumbnail : null;
            const desc = info.description ? info.description.substring(0, 120) + '...' : 'No description available.';
            const year = info.publishedDate ? info.publishedDate.substring(0, 4) : '—';
            const pages = info.pageCount ? info.pageCount + ' pages' : '';

            const card = document.createElement('div');
            card.className = 'result-card';
            card.innerHTML =
                '<div class="result-cover">' +
                    (cover ? '<img src="' + cover + '" alt="cover">' : '<div class="no-cover">📖</div>') +
                '</div>' +
                '<div class="result-info">' +
                    '<div class="result-title">' + title + '</div>' +
                    '<div class="result-author">by ' + authors + '</div>' +
                    '<div class="result-meta">' + genre + (year ? ' · ' + year : '') + (pages ? ' · ' + pages : '') + '</div>' +
                    '<div class="result-desc">' + desc + '</div>' +
                    '<button class="btn-add-from-search" onclick="addBookFromSearch(\'' +
                        escStr(title) + '\', \'' + escStr(authors) + '\', \'' + escStr(genre) + '\')">➕ Add to Library</button>' +
                '</div>';
            resultsGrid.appendChild(card);
        });

    } catch (err) {
        btn.textContent = 'Search';
        btn.disabled = false;
        resultsGrid.innerHTML = '<div class="results-loading">❌ Failed to fetch. Check your internet connection.</div>';
        console.error(err);
    }
}

function escStr(str) {
    return str.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

function addBookFromSearch(title, author, genre) {
    // Auto-generate a Book ID
    const newId = 'BK' + String(booksArray.length + 1).padStart(3, '0');

    // Check if already exists by title
    const exists = booksArray.find(function(b) { return b.title.toLowerCase() === title.toLowerCase(); });
    if (exists) { showtoast('"' + title + '" is already in your library!', "warn"); return; }

    const book = {
        id: newId, title: title, author: author,
        genre: genre, available: true,
        borrowedBy: null, borrowDate: null, dueDate: null
    };

    booksArray.push(book);
    booksMap[newId] = book;
    saveToStorage();
    showtoast('✅ "' + title + '" added as ' + newId + '!');
    updateStats();
    displayBooks();
}

function closeGlobalSearch() {
    document.getElementById('globalSearchResults').style.display = 'none';
    document.getElementById('globalSearchInput').value = '';
}
