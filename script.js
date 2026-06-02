// Global Variables
let currentUser = null;
let tableData = [];
let analysisResults = {};
const colorPalette = [
    '#e74c3c', '#3498db', '#9b59b6', '#f39c12',
    '#27ae60', '#1abc9c', '#e67e22', '#95a5a6'
];

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    loadUserSession();
});

// Event Listeners Setup
function setupEventListeners() {
    // Auth Forms
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);

    // Upload Area
    const uploadArea = document.getElementById('uploadArea');
    uploadArea.addEventListener('click', () => document.getElementById('imageInput').click());
    uploadArea.addEventListener('dragover', (e) => e.preventDefault());
    uploadArea.addEventListener('drop', handleImageDrop);

    document.getElementById('imageInput').addEventListener('change', handleImageUpload);
}

// Auth Functions
function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));

    event.target.classList.add('active');
    document.getElementById(tab + 'Form').classList.add('active');
}

function handleLogin(e) {
    e.preventDefault();
    const email = e.target.querySelector('input[type="email"]').value;
    const password = e.target.querySelector('input[type="password"]').value;

    // Simulate login (in production, use Firebase Auth)
    currentUser = {
        name: 'User',
        email: email,
        memberDate: new Date().toLocaleDateString()
    };

    localStorage.setItem('user', JSON.stringify(currentUser));
    showMainContent();
    e.target.reset();
}

function handleRegister(e) {
    e.preventDefault();
    const name = e.target.querySelector('input[type="text"]').value;
    const email = e.target.querySelectorAll('input[type="email"]')[0].value;
    const password = e.target.querySelectorAll('input[type="password"]')[0].value;
    const confirmPassword = e.target.querySelectorAll('input[type="password"]')[1].value;

    if (password !== confirmPassword) {
        alert('Passwords do not match!');
        return;
    }

    // Simulate registration (in production, use Firebase Auth)
    currentUser = {
        name: name,
        email: email,
        memberDate: new Date().toLocaleDateString()
    };

    localStorage.setItem('user', JSON.stringify(currentUser));
    showMainContent();
    e.target.reset();
}

function googleLogin() {
    // Simulate Google login (in production, use Firebase Google Auth)
    currentUser = {
        name: 'Google User',
        email: 'user@gmail.com',
        memberDate: new Date().toLocaleDateString()
    };

    localStorage.setItem('user', JSON.stringify(currentUser));
    showMainContent();
}

function logout() {
    currentUser = null;
    localStorage.removeItem('user');
    document.getElementById('authSection').style.display = 'flex';
    document.getElementById('mainContent').style.display = 'none';
    document.getElementById('loginForm').reset();
    document.getElementById('registerForm').reset();
}

function deleteAccount() {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
        localStorage.removeItem('user');
        logout();
        alert('Account deleted successfully.');
    }
}

function loadUserSession() {
    const user = localStorage.getItem('user');
    if (user) {
        currentUser = JSON.parse(user);
        showMainContent();
    }
}

function showMainContent() {
    document.getElementById('authSection').style.display = 'none';
    document.getElementById('mainContent').style.display = 'block';
    updateProfileDisplay();
    showSection('home');
}

function updateProfileDisplay() {
    if (currentUser) {
        document.getElementById('userName').textContent = currentUser.name;
        document.getElementById('userEmail').textContent = currentUser.email;
        document.getElementById('memberDate').textContent = currentUser.memberDate;
    }
}

// Navigation
function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');
}

// Image Upload
function handleImageDrop(e) {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleImageUpload({ target: { files: files } });
    }
}

function handleImageUpload(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            // In production, use OCR to extract table data from image
            alert('Image uploaded: ' + file.name + '\n\nIn production, OCR would extract the table data.');
        };
        reader.readAsDataURL(file);
    }
}

// Data Processing
function parseTableData() {
    const data = document.getElementById('tableData').value.trim().split('\n');
    tableData = [];

    for (let i = 0; i < data.length; i++) {
        const row = data[i].trim().split(/\s+/);
        if (row.length === 2 && row[0].length === 6 && row[1].length === 6) {
            tableData.push({
                row: i + 1,
                col1: row[0],
                col2: row[1]
            });
        }
    }

    if (tableData.length === 0) {
        alert('Invalid table format. Please enter 24 rows with 2 columns of 6-digit numbers.');
        return false;
    }

    return true;
}

// Analysis Functions
function analyzePattern() {
    if (!parseTableData()) return;

    const row1 = parseInt(document.getElementById('row1').value);
    const row2 = parseInt(document.getElementById('row2').value);

    if (!row1 || !row2 || row1 < 1 || row2 < 1 || row1 > 24 || row2 > 24) {
        alert('Please enter valid row numbers (1-24).');
        return;
    }

    analysisResults = {
        top: analyzeTop(row1, row2),
        middle: analyzeMiddle(row1, row2),
        last: analyzeLast(row1, row2)
    };

    displayResults();
    document.getElementById('resultsSection').style.display = 'block';
}

function analyzeTop(startRow1, startRow2) {
    return analyzeByDigitPosition(startRow1, startRow2, 3); // 4th digit from right (index 3)
}

function analyzeMiddle(startRow1, startRow2) {
    return analyzeByDigitPosition(startRow1, startRow2, 1); // 2nd digit from right (index 1)
}

function analyzeLast(startRow1, startRow2) {
    return analyzeByDigitPosition(startRow1, startRow2, 0); // Last digit (index 0)
}

function analyzeByDigitPosition(startRow1, startRow2, digitIndex) {
    const results = [];
    let colorIndex = 0;

    for (let i = 0; i < tableData.length - Math.max(startRow1, startRow2) + 1; i++) {
        const idx1 = startRow1 - 1 + i;
        const idx2 = startRow2 - 1 + i;

        if (idx1 >= tableData.length || idx2 >= tableData.length) break;

        const num1 = tableData[idx1].col1;
        const num2 = tableData[idx2].col2;

        // Get target digit from column 1
        const targetDigit = num1[6 - 1 - digitIndex];

        // Find matches in rows above
        const matches = [];
        for (let j = idx1 - 1; j >= 0; j--) {
            const searchNum = tableData[j].col1;
            for (let k = 0; k < searchNum.length; k++) {
                if (searchNum[k] === targetDigit) {
                    matches.push({
                        row: tableData[j].row,
                        col1: searchNum,
                        position: k,
                        color: colorPalette[colorIndex % colorPalette.length]
                    });
                }
            }
        }

        // Copy positions to column 2
        const col2Highlights = matches.map(m => m.position);

        results.push({
            pairIndex: i,
            row1: tableData[idx1].row,
            row2: tableData[idx2].row,
            num1: num1,
            num2: num2,
            targetDigit: targetDigit,
            targetPosition: 6 - 1 - digitIndex,
            matches: matches,
            col2Highlights: col2Highlights,
            color: colorPalette[colorIndex % colorPalette.length]
        });

        colorIndex++;
    }

    return results;
}

// Display Results
function displayResults() {
    displayResultTable('top', analysisResults.top);
    displayResultTable('middle', analysisResults.middle);
    displayResultTable('last', analysisResults.last);
}

function displayResultTable(type, results) {
    const tableContainer = document.getElementById(type + 'Table');
    let html = '<table><thead><tr><th>Row</th><th>Column 1</th><th>Column 2</th></tr></thead><tbody>';

    results.forEach(result => {
        const col1Html = highlightDigits(result.num1, [result.targetPosition], result.color);
        const col2Html = highlightDigits(result.num2, result.col2Highlights, result.color);

        html += `<tr>
            <td>${result.row1} ↔ ${result.row2}</td>
            <td>${col1Html}</td>
            <td>${col2Html}</td>
        </tr>`;
    });

    html += '</tbody></table>';
    tableContainer.innerHTML = html;
}

function highlightDigits(number, positions, color) {
    let html = '';
    for (let i = 0; i < number.length; i++) {
        if (positions.includes(i)) {
            html += `<span class="highlighted" style="background-color: ${color}; color: white; border-radius: 3px; padding: 2px 4px;">${number[i]}</span>`;
        } else {
            html += number[i];
        }
    }
    return html;
}

function switchResultTab(tab) {
    document.querySelectorAll('.result-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.result-content').forEach(c => c.classList.remove('active'));

    event.target.classList.add('active');
    document.getElementById(tab + 'Result').classList.add('active');
}

// Export Functions
function exportAsImage(format) {
    alert('Exporting as ' + format.toUpperCase() + '...\n\nIn production, this would generate and download an image file.');
}

function exportAsTable(format) {
    alert('Exporting as ' + format.toUpperCase() + '...\n\nIn production, this would generate and download a ' + format + ' file.');
}

// Delete Functions
function deleteResult() {
    if (confirm('Are you sure you want to delete this result?')) {
        document.getElementById('resultsSection').style.display = 'none';
        analysisResults = {};
        alert('Result deleted successfully.');
    }
}

function deleteProject() {
    if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
        document.getElementById('tableData').value = '';
        document.getElementById('row1').value = '';
        document.getElementById('row2').value = '';
        document.getElementById('resultsSection').style.display = 'none';
        tableData = [];
        analysisResults = {};
        alert('Project deleted successfully.');
    }
}

function clearData() {
    document.getElementById('tableData').value = '';
    document.getElementById('row1').value = '';
    document.getElementById('row2').value = '';
    document.getElementById('resultsSection').style.display = 'none';
}
