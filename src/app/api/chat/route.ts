import { NextRequest, NextResponse } from "next/server";
import guidelineData from "../../../../data/guidelineKnowledge.json";
import historyDb from "../../../../data/csHistoryDatabase.json";

// 한국어 조사 분리 및 키워드 추출 헬퍼
function extractKeywords(query: string) {
  const clean = query.replace(/[?.,!~()'"-]/g, " ");
  const words = clean.split(/\s+/).filter((w) => w.length >= 2);
  const keywords = new Set(words);

  const suffixes = [
    "으로",
    "에서",
    "에게",
    "에도",
    "로",
    "를",
    "을",
    "이",
    "가",
    "은",
    "는",
    "도",
    "의",
    "에",
    "와",
    "과",
    "하며",
    "하고",
  ];
  for (const w of words) {
    for (const s of suffixes) {
      if (w.endsWith(s) && w.length - s.length >= 2) {
        keywords.add(w.slice(0, -s.length));
      }
    }
    if (w.includes("2저자")) {
      keywords.add("2저자");
      keywords.add("사사");
    }
    if (w.includes("1저자")) {
      keywords.add("1저자");
      keywords.add("사사");
    }
  }
  return Array.from(keywords);
}

// 과거 상담 사례 검색 헬퍼 (키워드 매칭)
function searchSimilarCases(query: string, topN = 4) {
  const keywords = extractKeywords(query);

  const scored = (historyDb as any[]).map((item) => {
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

    if (item.date && item.date.startsWith("2026")) score += 1.5;
    else if (item.date && item.date.startsWith("2025")) score += 0.8;

    return { item, score };
  });

  return scored
    .filter((s) => s.score > 3)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN)
    .map((s) => s.item);
}

export async function POST(req: NextRequest) {
  try {
    const { question, userApiKey } = await req.json();

    if (!question || typeof question !== "string") {
      return NextResponse.json(
        { error: "문의 내용을 입력해 주세요." },
        { status: 400 }
      );
    }

    const apiKey = userApiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "Gemini API 키가 설정되지 않았습니다. Vercel 환경 변수에 등록하거나 상단 메뉴에서 키를 입력해 주세요.",
        },
        { status: 401 }
      );
    }

    // 1. 과거 실제 상담 DB에서 가장 유사한 레퍼런스 케이스 추출
    const matchedCases = searchSimilarCases(question, 4);

    const systemInstruction = `
너는 '현대차 정몽구 재단'의 「현대차 정몽구 스칼러십 장학생 가이드 라인 (2026년 7월 개정, 총 31페이지)」과 「실제 장학생 상담 Q&A 기록(1,620건 DB)」을 완벽히 숙지한 최고 전문 CS 상담 에이전트이다.

사용자의 문의에 대해 반드시 다음 [2가지 관점의 답변을 명확히 분리]하여 제시하라.
(※ 실무 처리 매뉴얼 절차는 생성하지 마라.)

1. [가이드라인 규정 기반 답변] (guideline_answer):
   - 공식 가이드라인 규정집(31p)의 원칙, 자격 기준, 금액, 제출서류, 의무사항에 입각한 정석적인 답변.
   - 반드시 해당 규정이 명시된 실제 페이지 번호(source_pages)와 해당 조항명(section), 원문 핵심 문장(guideline_evidence)을 정확히 명시하라.

2. [실제 상담 사례 기반 답변] (case_answer):
   - 함께 제공된 [실제 과거 상담 DB 레퍼런스]에 기반하여, 운영사무국이 실제로 유사한 케이스를 어떻게 유연하게 응대하고 처리했는지에 대한 실무형 답변.
   - 예: "실제 사무국의 과거 처리 사례에 따르면, 1저자가 아니더라도 사사 기입이 가능한 경우 기입을 권장하고 있으며..." 처럼 실제 처리 관행을 장학생에게 알기 쉽게 안내.

[공식 가이드라인 데이터]:
${JSON.stringify(guidelineData, null, 2)}

[검색된 실제 과거 상담 DB 레퍼런스 (총 ${matchedCases.length}건)]:
${JSON.stringify(matchedCases, null, 2)}

반드시 다음 JSON 형식으로만 응답하라. 마크다운(\`\`\`json) 없이 순수 JSON 문자열만 출력해야 한다.
{
  "guideline_answer": "공식 가이드라인 규정에 입각한 고객 응대 답변",
  "source_pages": [5, 30],
  "section": "규정 조항명 (예: 공통사항 > 학적 변동)",
  "guideline_evidence": "가이드라인 원문 조항 핵심 문장 발췌",
  "case_answer": "실제 과거 상담 사례 및 실무 관행을 반영한 실무형 답변",
  "contact": "운영사무국 연락처 (02-6958-1947, ondreamimpact@univ.me / 평일 10~17시)"
}
`;

    // 가장 안정적이고 응답률 높은 최신 모델 순서
    const candidateModels = [
      "gemini-3.8-flash",
      "gemini-3.5-flash-lite",
      "gemini-3.5-flash",
      "gemini-flash-latest",
    ];

    let lastError = "";

    for (const modelName of candidateModels) {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: `고객/장학생 문의: "${question}"` }],
              },
            ],
            systemInstruction: {
              parts: [{ text: systemInstruction }],
            },
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.1,
            },
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          console.error(`Model ${modelName} returned status ${response.status}:`, errText);
          lastError = `${modelName} (${response.status}): ${errText}`;
          continue;
        }

        const data = await response.json();
        let rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawContent) {
          throw new Error("응답 내용이 비어 있습니다.");
        }

        rawContent = rawContent
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .trim();
        const parsed = JSON.parse(rawContent);

        // 매칭된 실제 사례 레퍼런스 데이터도 클라이언트에 함께 전달
        return NextResponse.json({
          ...parsed,
          case_references: matchedCases.map((c: any) => ({
            id: c.id,
            date: c.date,
            category: c.category,
            subCategory: c.subCategory,
            question: c.question,
            answer: c.answer,
          })),
        });
      } catch (e: any) {
        console.error("Error in model attempt:", modelName, e);
        lastError = `${modelName} 처리 오류: ${e.message}`;
      }
    }

    console.error("All models failed:", lastError);
    return NextResponse.json(
      { error: `Gemini API 호출에 실패했습니다. (${lastError})` },
      { status: 500 }
    );
  } catch (err: any) {
    console.error("Fatal route error:", err);
    return NextResponse.json(
      { error: err.message || "서버 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
