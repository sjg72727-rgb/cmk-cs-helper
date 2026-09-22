const fs = require('fs');

const raw = fs.readFileSync('C:/Users/sjg72/.gemini/antigravity/brain/adf6dcd4-f312-4fec-80c3-33df158b518e/.system_generated/steps/225/content.md', 'utf8');

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
const qIdx = header.indexOf('문의내용');
const aIdx = header.indexOf('답변내용');
const catIdx = header.indexOf('분야');
const subCatIdx = header.indexOf('상세구분');
const dateIdx = header.indexOf('일자');

const validRows = lines.slice(headerIdx + 1).filter(r => r[qIdx] && r[aIdx] && r[qIdx].length > 5);

console.log('Total valid Q&A entries:', validRows.length);
console.log('Sample entry:', {
  date: validRows[0][dateIdx],
  category: validRows[0][catIdx],
  subCategory: validRows[0][subCatIdx],
  question: validRows[0][qIdx].slice(0, 80),
  answer: validRows[0][aIdx].slice(0, 80)
});
