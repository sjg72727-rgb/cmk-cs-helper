const fs = require('fs');
const path = require('path');

const csvPath = 'C:/Users/sjg72/.gemini/antigravity/brain/adf6dcd4-f312-4fec-80c3-33df158b518e/.system_generated/steps/225/content.md';
const raw = fs.readFileSync(csvPath, 'utf8');

function parseCSV(text) {
  const rows = [];
  let row = [];
  let col = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i+1];
    if (c === '"') {
      if (inQuotes && next === '"') {
        col += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      row.push(col.trim());
      col = '';
    } else if ((c === '\r' || c === '\n') && !inQuotes) {
      if (c === '\r' && next === '\n') i++;
      row.push(col.trim());
      if (row.some(x => x.length > 0)) rows.push(row);
      row = [];
      col = '';
    } else {
      col += c;
    }
  }
  if (col || row.length) {
    row.push(col.trim());
    rows.push(row);
  }
  return rows;
}

const lines = parseCSV(raw);
const headerIdx = lines.findIndex(r => r.includes('문의내용'));
const header = lines[headerIdx];
const noIdx = header.indexOf('No.');
const qIdx = header.indexOf('문의내용');
const aIdx = header.indexOf('답변내용');
const catIdx = header.indexOf('분야');
const subCatIdx = header.indexOf('상세구분');
const dateIdx = header.indexOf('일자');

const validRows = lines.slice(headerIdx + 1).filter(r => {
  const q = r[qIdx] || '';
  const a = r[aIdx] || '';
  return q.length >= 5 && a.length >= 5;
});

const cleanedData = validRows.map((r, i) => {
  let q = r[qIdx] || '';
  let a = r[aIdx] || '';
  // 전화번호나 특정 이메일 등 개인정보 최소 마스킹
  q = q.replace(/010-\d{4}-\d{4}/g, '010-****-****');
  a = a.replace(/010-\d{4}-\d{4}/g, '010-****-****');

  return {
    id: r[noIdx] || `${i + 1}`,
    date: r[dateIdx] || '',
    category: r[catIdx] || '일반문의',
    subCategory: r[subCatIdx] || '',
    question: q,
    answer: a
  };
});

const outPath = path.join(__dirname, '../data/csHistoryDatabase.json');
fs.writeFileSync(outPath, JSON.stringify(cleanedData, null, 2), 'utf8');

console.log(`Successfully generated ${cleanedData.length} Q&A records to ${outPath}`);
