const historyDb = require('../data/csHistoryDatabase.json');

function extractKeywords(query) {
  const clean = query.replace(/[?.,!~()'"-]/g, ' ');
  const words = clean.split(/\s+/).filter(w => w.length >= 2);
  const keywords = new Set(words);

  // 한국어 조사 분리 헬퍼 (예: "제2저자로" -> "제2저자", "2저자", "논문에도" -> "논문")
  const suffixes = ['으로', '에서', '에게', '에도', '로', '를', '을', '이', '가', '은', '는', '도', '의', '에', '와', '과', '하며', '하고'];
  for (const w of words) {
    for (const s of suffixes) {
      if (w.endsWith(s) && w.length - s.length >= 2) {
        keywords.add(w.slice(0, -s.length));
      }
    }
    // 숫자+저자 (예: 제2저자 -> 2저자, 저자)
    if (w.includes('2저자')) { keywords.add('2저자'); keywords.add('사사'); }
    if (w.includes('1저자')) { keywords.add('1저자'); keywords.add('사사'); }
  }
  return Array.from(keywords);
}

function searchSimilarCases(query, topN = 4) {
  const keywords = extractKeywords(query);

  const scored = historyDb.map(item => {
    let score = 0;
    const textToSearch = `${item.category} ${item.subCategory} ${item.question} ${item.answer}`.toLowerCase();
    const qLower = item.question.toLowerCase();

    for (const kw of keywords) {
      const k = kw.toLowerCase();
      if (qLower.includes(k)) {
        score += 6;
      } else if (textToSearch.includes(k)) {
        score += 3;
      }
    }

    if (item.date && item.date.startsWith('2026')) score += 1.5;
    else if (item.date && item.date.startsWith('2025')) score += 0.8;

    return { item, score };
  });

  return scored
    .filter(s => s.score > 3)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN)
    .map(s => s.item);
}

// Test queries
console.log('--- Test 1: 사사표기 2저자 ---');
console.log(searchSimilarCases('제2저자 논문 사사표기 해야 하나요?', 2).map(c => ({
  date: c.date,
  category: c.category,
  q: c.question.slice(0, 50),
  a: c.answer.slice(0, 60)
})));

console.log('--- Test 2: 영문 증명서 ---');
console.log(searchSimilarCases('영문 장학금 수혜 증명서 발급받고 싶어요', 2).map(c => ({
  date: c.date,
  category: c.category,
  q: c.question.slice(0, 50),
  a: c.answer.slice(0, 60)
})));
