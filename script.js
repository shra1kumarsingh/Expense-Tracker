let users = JSON.parse(localStorage.getItem('users')) || {};
let userEmail = localStorage.getItem('userEmail') || null;  // Currently logged in user

function userKey(key) {
    // Namespaced key per user to avoid cross-user data in localStorage
    if (!userEmail) return key;
    return `${key}_${userEmail}`;
}

let expenses = JSON.parse(localStorage.getItem(userKey('expenses')) || '[]');
let budget = parseFloat(localStorage.getItem(userKey('budget')) || '0') || 0;
let reminders = JSON.parse(localStorage.getItem(userKey('reminders')) || '[]');

// Function to display the appropriate section (login, tracker, dashboard)
function updateUI() {
    const authSection = document.getElementById('auth-section');
    const expenseTracker = document.getElementById('expense-tracker');
    const dashboard = document.getElementById('dashboard');
    const usernameDisplay = document.getElementById('username-display'); // Get the username display element

    if (userEmail) {
        authSection.style.display = 'none';
        expenseTracker.style.display = 'block';
        dashboard.style.display = 'block';
        usernameDisplay.textContent = userEmail; // Display the email as the username
    } else {
        authSection.style.display = 'block';
        expenseTracker.style.display = 'none';
        dashboard.style.display = 'none';
    }
    // reload per-user data
    expenses = JSON.parse(localStorage.getItem(userKey('expenses')) || '[]');
    reminders = JSON.parse(localStorage.getItem(userKey('reminders')) || '[]');
    budget = parseFloat(localStorage.getItem(userKey('budget')) || '0') || 0;
    document.getElementById('budget-limit').value = budget || '';
    renderExpenses();
    updateChart();
    renderReminders();
    checkBudget();
    renderDashboard();
}

// Authentication (Simplified - No real backend)
function register() {
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const errorDisplay = document.getElementById('registration-error');

    if (!email || !password) {
        errorDisplay.textContent = "Please enter both email and password.";
        return;
    }

    // Save user credentials locally (insecure: for demo only)
    users[email] = { password };
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('userEmail', email);
    userEmail = email;
    errorDisplay.textContent = ""; // Clear any previous errors
    updateUI();
}

function login() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorDisplay = document.getElementById('login-error');

    if (!email || !password) {
        errorDisplay.textContent = "Please enter both email and password.";
        return;
    }

    if (users[email] && users[email].password === password) {
        userEmail = email;
        localStorage.setItem('userEmail', email);
        errorDisplay.textContent = "";
        updateUI();
    } else {
        errorDisplay.textContent = "Invalid credentials.";
    }
}

function logout() {
    userEmail = null;
    localStorage.removeItem('userEmail');
    updateUI();
}

function showRegistration() {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('registration-form').style.display = 'block';
}

function showLogin() {
    document.getElementById('login-form').style.display = 'block';
    document.getElementById('registration-form').style.display = 'none';
}


// Expense Tracking
function saveExpense() {
    const id = document.getElementById('expense-id').value;
    const name = document.getElementById('expense-name').value.trim();
    const amount = parseFloat(document.getElementById('expense-amount').value);
    const category = document.getElementById('expense-category').value;
    const date = document.getElementById('expense-date').value;

    if (!name || !amount || !category || !date) {
        alert('Please fill in all fields.');
        return;
    }

    if (id) {
        // Edit existing
        const idx = expenses.findIndex(e => e.id === id);
        if (idx !== -1) {
            expenses[idx] = { ...expenses[idx], name, amount, category, date };
        }
    } else {
        // Add new
        const expense = { id: cryptoRandomId(), name, amount, category, date };
        expenses.push(expense);
    }

    localStorage.setItem(userKey('expenses'), JSON.stringify(expenses));
    // reset form
    clearExpenseForm();
    renderExpenses();
    updateChart();
    checkBudget();
}

function cryptoRandomId() {
    // small helper to generate unique ids
    return 'id-' + Math.random().toString(36).slice(2, 9);
}

function deleteExpenseById(id) {
    if (!confirm('Delete this expense?')) return;
    expenses = expenses.filter(e => e.id !== id);
    localStorage.setItem(userKey('expenses'), JSON.stringify(expenses));
    renderExpenses();
    updateChart();
    checkBudget();
}

function clearExpenseForm() {
    document.getElementById('expense-name').value = '';
    document.getElementById('expense-amount').value = '';
    document.getElementById('expense-date').value = '';
}

function renderExpenses() {
    const expensesList = document.getElementById('expenses');
    expensesList.innerHTML = '';

    expenses.forEach((expense) => {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${escapeHtml(expense.name)}</strong> - $${expense.amount.toFixed(2)} ` +
            `(${escapeHtml(expense.category)}) - ${escapeHtml(expense.date)}`;

        const editButton = document.createElement('button');
        editButton.textContent = 'Edit';
        editButton.onclick = () => startEditExpense(expense.id);

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.onclick = () => deleteExpenseById(expense.id);

        li.appendChild(editButton);
        li.appendChild(deleteButton);
        expensesList.appendChild(li);
    });

    updateTotalExpenses();
}


// Expense Summary & Chart
function updateTotalExpenses() {
    const total = expenses.reduce((acc, expense) => acc + expense.amount, 0);
    document.getElementById('total-expenses').textContent = `Total Expenses: $${total.toFixed(2)}`;
}

function updateChart() {
    const categoryTotals = {};
    expenses.forEach(expense => {
        if (categoryTotals[expense.category]) {
            categoryTotals[expense.category] += expense.amount;
        } else {
            categoryTotals[expense.category] = expense.amount;
        }
    });

    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);

    const ctx = document.getElementById('expense-chart').getContext('2d');
    if (window.myChart) {
        window.myChart.destroy(); // Destroy the existing chart if it exists
    }
    window.myChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                label: 'Expense Categories',
                data: data,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(255, 206, 86, 0.6)',
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(153, 102, 255, 0.6)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                },
                title: {
                    display: true,
                    text: 'Expenses by Category'
                }
            }
        }
    });
}

// Budget Limiter
function setBudget() {
    budget = parseFloat(document.getElementById('budget-limit').value) || 0;
    localStorage.setItem(userKey('budget'), budget);
    checkBudget();
}

function checkBudget() {
    const totalExpenses = expenses.reduce((acc, expense) => acc + expense.amount, 0);
    const budgetAlert = document.getElementById('budget-alert');

    if (totalExpenses > budget) {
        budgetAlert.textContent = 'Budget exceeded!';
        budgetAlert.classList.add('alert-message');
    } else if (totalExpenses > budget * 0.8) {
        budgetAlert.textContent = 'Approaching budget limit.';
        budgetAlert.classList.add('alert-message');
    } else {
        budgetAlert.textContent = '';
        budgetAlert.classList.remove('alert-message');
    }
}

// Reminder System
function addReminder() {
    const name = document.getElementById('reminder-name').value;
    const amount = parseFloat(document.getElementById('reminder-amount').value);
    const date = document.getElementById('reminder-date').value;
    const frequency = document.getElementById('reminder-frequency').value;

    if (name && amount && date && frequency) {
        const reminder = { id: cryptoRandomId(), name, amount, date, frequency };
        reminders.push(reminder);
        localStorage.setItem(userKey('reminders'), JSON.stringify(reminders));
        renderReminders();
        clearReminderForm();
    } else {
        alert('Please fill in all reminder fields.');
    }
}

function deleteReminder(index) {
    reminders.splice(index, 1);
    localStorage.setItem(userKey('reminders'), JSON.stringify(reminders));
    renderReminders();
}

function renderReminders() {
    const remindersList = document.getElementById('reminders');
    remindersList.innerHTML = '';
    // Process reminders due (create expenses if due)
    processReminders();

    reminders.forEach((reminder, index) => {
        const li = document.createElement('li');
        li.innerHTML = `${escapeHtml(reminder.name)} - $${reminder.amount.toFixed(2)} - ${escapeHtml(reminder.date)} (${escapeHtml(reminder.frequency)})`;

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.onclick = () => { reminders.splice(index, 1); localStorage.setItem(userKey('reminders'), JSON.stringify(reminders)); renderReminders(); };

        li.appendChild(deleteButton);
        remindersList.appendChild(li);
    });
}

function processReminders() {
    if (!reminders || reminders.length === 0) return;
    const today = new Date().toISOString().slice(0, 10);
    let changed = false;
    reminders.forEach((r) => {
        if (r.date <= today) {
            // create an expense for this reminder
            const expense = { id: cryptoRandomId(), name: r.name, amount: r.amount, category: 'Recurring', date: r.date };
            expenses.push(expense);
            changed = true;
            // advance next date
            const next = nextDateForFrequency(r.date, r.frequency);
            r.date = next;
        }
    });
    if (changed) {
        localStorage.setItem(userKey('expenses'), JSON.stringify(expenses));
        localStorage.setItem(userKey('reminders'), JSON.stringify(reminders));
        renderExpenses();
        updateChart();
        checkBudget();
    }
}

function nextDateForFrequency(dateStr, frequency) {
    const d = new Date(dateStr);
    if (frequency === 'Monthly') d.setMonth(d.getMonth() + 1);
    else if (frequency === 'Weekly') d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
}

function startEditExpense(id) {
    const e = expenses.find(x => x.id === id);
    if (!e) return;
    document.getElementById('expense-id').value = e.id;
    document.getElementById('expense-name').value = e.name;
    document.getElementById('expense-amount').value = e.amount;
    document.getElementById('expense-category').value = e.category;
    document.getElementById('expense-date').value = e.date;
    document.getElementById('expense-save-btn').textContent = 'Save Changes';
}

function escapeHtml(str) {
    return String(str).replace(/[&<>\"]+/g, function(s) {
        return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[s];
    });
}

function clearReminderForm() {
    document.getElementById('reminder-name').value = '';
    document.getElementById('reminder-amount').value = '';
    document.getElementById('reminder-date').value = '';
}

// Filtering and Search
function filterExpenses() {
    const searchTerm = document.getElementById('search-term').value.toLowerCase();
    const filterCategory = document.getElementById('filter-category').value;

    const filteredExpenses = expenses.filter(expense => {
        const nameMatch = expense.name.toLowerCase().includes(searchTerm);
        const categoryMatch = filterCategory === 'All' || expense.category === filterCategory;
        return nameMatch && categoryMatch;
    });

    renderFilteredExpenses(filteredExpenses);
}

function renderFilteredExpenses(filteredExpenses) {
    const expensesList = document.getElementById('expenses');
    expensesList.innerHTML = '';

    filteredExpenses.forEach((expense) => {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${escapeHtml(expense.name)}</strong> - $${expense.amount.toFixed(2)} ` +
            `(${escapeHtml(expense.category)}) - ${escapeHtml(expense.date)}`;

        const editButton = document.createElement('button');
        editButton.textContent = 'Edit';
        editButton.onclick = () => startEditExpense(expense.id);

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.onclick = () => deleteExpenseById(expense.id);

        li.appendChild(editButton);
        li.appendChild(deleteButton);
        expensesList.appendChild(li);
    });
}

// Dashboard analytics
function renderDashboard() {
    const total = expenses.reduce((s, e) => s + e.amount, 0);
    const avg = expenses.length ? (total / expenses.length) : 0;
    const largest = expenses.length ? expenses.reduce((a,b) => a.amount>b.amount?a:b).amount : 0;
    const stats = document.getElementById('dashboard-stats');
    if (stats) {
        stats.innerHTML = `<p><strong>Total:</strong> $${total.toFixed(2)}</p>` +
            `<p><strong>Average:</strong> $${avg.toFixed(2)}</p>` +
            `<p><strong>Largest:</strong> $${largest.toFixed(2)}</p>`;
    }
}

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    updateUI();
});
