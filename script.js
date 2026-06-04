let currentUser = null;
let tableData = [];
let analysisResults = {};

const colorPalette = [
  '#e74c3c', '#3498db', '#9b59b6', '#f39c12',
  '#27ae60', '#1abc9c', '#e67e22', '#95a5a6'
];

document.addEventListener('DOMContentLoaded', function () {
  setupEventListeners();
  loadUserSession();
});

function setupEventListeners() {
  document.getElementById('loginForm').addEventListener('submit', handleLogin);
  document.getElementById('registerForm').addEventListener('submit', handleRegister);

  const uploadArea = document.getElementById('uploadArea');
  uploadArea.addEventListener('click', () => document.getElementById('imageInput').click());
  uploadArea.addEventListener('dragover', (e) => e.preventDefault());
  uploadArea.addEventListener('drop', handleImageDrop);

  document.getElementById('imageInput').addEventListener('change', handleImageUpload);
}

function switchTab(tab, e) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));

  e.target.classList.add('active');
  document.getElementById(tab + 'Form').classList.add('active');
}

function handleLogin(e) {
  e.preventDefault();
  const email = e.target.querySelector('input[type="email"]').value;

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

function showSection(sectionId) {
  document.querySelectorAll('.section').forEach(section => section.classList.remove('active'));
  document.getElementById(sectionId).classList.add('active');
}

function switchResultTab(tab, e) {
  document.querySelectorAll('.result-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.result-content').forEach(c => c.classList.remove('active'));

  e.target.classList.add('active');
  document.getElementById(tab + 'Result').classList.add('active');
}

function handleImageDrop(e) {
  e.preventDefault();
  const files = e.dataTransfer.files;
  if (files.length > 0) {
    handleImageUpload({ target: { files: files } });
  }
}

async function handleImageUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const uploadArea = document.getElementById('uploadArea');
  const originalText = uploadArea.innerHTML;
  uploadArea.innerHTML = '<p>Processing image... Please wait ⏳</p>';

  try {
    const worker = await Tesseract.createWorker('eng');
    const ret = await worker.recognize(file);
    const text = ret.data.text;
    await worker.terminate();

    const cleaned = text.replace(/\D/g, '');
    const numbers = cleaned.match(/.{6}/g);

    if (numbers && numbers.length >= 2) {
      let formattedData = '';
      for (let i = 0; i < numbers.length; i += 2) {
        if (numbers[i + 1]) {
          formattedData += `${numbers[i]} ${numbers[i + 1]}\n`;
        }
      }
      document.getElementById('tableData').value = formattedData.trim();
      alert('Success! Extracted ' + numbers.length + ' numbers from the image.');
    } else {
      alert('No 6-digit numbers found in the image. Please try a clearer image or enter manually.');
    }
  } catch (error) {
    console.error('OCR Error:', error);
    alert('Error processing image. Please try again or enter manually.');
  } finally {
    uploadArea.innerHTML = originalText;
  }
}

function parseTableData() {
  const data = document.getElementById('tableData').value.trim().split('\n');
  tableData = [];

  for (let i = 0; i < data.length; i++) {
    const row = data[i].trim().split(/\s+/);

    if (row.length >= 2) {
      const col1 = row[0].padStart(6, '0');
      const col2 = row[1].padStart(6, '0');

      tableData.push({
        row: i + 1,
        col1: col1,
        col2: col2
      });
    }
  }

  if (tableData.length === 0) {
    alert('Invalid table format. Please enter at least one row with two numbers.');
    return false;
  }

  while (tableData.length < 24) {
    tableData.push({
      row: tableData.length + 1,
      col1: '000000',
      col2: '000000'
    });
  }

  return true;
}

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
  return analyzeByDigitPosition(startRow1, startRow2, 'TOP');
}

function analyzeMiddle(startRow1, startRow2) {
  return analyzeByDigitPosition(startRow1, startRow2, 'MIDDLE');
}

function analyzeLast(startRow1, startRow2) {
  return analyzeByDigitPosition(startRow1, startRow2, 'LAST');
}

function analyzeByDigitPosition(startRow1, startRow2, mode) {
  const results = [];
  let colorIndex = 0;

  let actualIndex = 0;
  if (mode === 'TOP') {
    actualIndex = 3; // 123456 -> 4
  } else if (mode === 'MIDDLE') {
    actualIndex = 4; // 123456 -> 5
  } else {
    actualIndex = 5; // 123456 -> 6
  }

  const maxIterations = tableData.length - Math.max(startRow1, startRow2) + 1;
  if (maxIterations <= 0) return results;

  for (let i = 0; i < maxIterations; i++) {
    const idx1 = startRow1 - 1 + i;
    const idx2 = startRow2 - 1 + i;

    const num1 = tableData[idx1].col1;
    const num2 = tableData[idx2].col2;

    const targetDigit = num1[actualIndex];
    const currentColor = colorPalette[colorIndex % colorPalette.length];

    const highlightedPositions = [];
    for (let j = 0; j < idx1; j++) {
      const searchNum = tableData[j].col1;
      for (let k = 0; k < searchNum.length; k++) {
        if (searchNum[k] === targetDigit) {
          highlightedPositions.push({ rowIdx: j, charIdx: k });
        }
      }
    }

    results.push({
      pairLabel: `Row ${idx1 + 1} ↔ Row ${idx2 + 1}`,
      num1: num1,
      num2: num2,
      targetIdx: actualIndex,
      color: currentColor,
      highlights: highlightedPositions,
      allRows: tableData.map(d => ({ col1: d.col1, col2: d.col2 }))
    });

    colorIndex++;
  }

  return results;
}

function displayResultTable(type, results) {
  const tableContainer = document.getElementById(type + 'Table');
  let html = '';

  results.forEach((result) => {
    html += `<div class="pair-result" style="border-color:${result.color};">`;
    html += `<h5 style="color:${result.color};">Comparison: ${result.pairLabel} (Target: ${result.num1[result.targetIdx]})</h5>`;
    html += '<table><thead><tr><th>Row</th><th>Column 1</th><th>Column 2</th></tr></thead><tbody>';

    result.allRows.forEach((row, rIdx) => {
      const rowNum = rIdx + 1;
      const pairRow1 = parseInt(result.pairLabel.match(/Row (\d+)/)[1]);

      let col1Content = '';
      let col2Content = '';

      for (let c = 0; c < 6; c++) {
        const isTarget = (rowNum === pairRow1 && c === result.targetIdx);
        const isHighlighted = result.highlights.some(h => h.rowIdx === rIdx && h.charIdx === c);

        if (isTarget) {
          col1Content += `<span class="target-digit" style="background-color:${result.color};color:white;padding:2px 6px;border-radius:4px;font-weight:bold;display:inline-block;">${row.col1[c]}</span>`;
        } else if (isHighlighted) {
          col1Content += `<span style="border:2px solid ${result.color};padding:0 2px;border-radius:2px;">${row.col1[c]}</span>`;
        } else {
          col1Content += row.col1[c];
        }

        if (isTarget) {
          col2Content += `<span class="target-digit" style="background-color:${result.color};color:white;padding:2px 6px;border-radius:4px;font-weight:bold;display:inline-block;">${row.col2[c]}</span>`;
        } else if (isHighlighted) {
          col2Content += `<span style="border:2px solid ${result.color};padding:0 2px;border-radius:2px;">${row.col2[c]}</span>`;
        } else {
          col2Content += row.col2[c];
        }
      }

      html += `<tr><td>${rowNum}</td><td>${col1Content}</td><td>${col2Content}</td></tr>`;
    });

    html += '</tbody></table></div>';
  });

  tableContainer.innerHTML = html;
}

function displayResults() {
  displayResultTable('top', analysisResults.top);
  displayResultTable('middle', analysisResults.middle);
  displayResultTable('last', analysisResults.last);
}

function exportAsImage(format) {
  alert('Exporting as ' + format.toUpperCase() + '...\n\nIn production, this would generate and download an image file.');
}

function exportAsTable(format) {
  alert('Exporting as ' + format.toUpperCase() + '...\n\nIn production, this would generate and download a ' + format + ' file.');
}

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