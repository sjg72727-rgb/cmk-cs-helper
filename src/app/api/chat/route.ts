import { NextRequest, NextResponse } from "next/server";
import guidelineData from "../../../../data/guidelineKnowledge.json";

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
            "Gemini API 키가 설정되지 않았습니다. Vercel 환경 변수에 GEMINI_API_KEY를 등록하거나 상단 메뉴에서 키를 입력해 주세요.",
        },
        { status: 401 }
      );
    }

    const systemInstruction = `
너는 '현대차 정몽구 재단'의 「현대차 정몽구 스칼러십 장학생 가이드 라인 (2026년 7월 개정, 총 31페이지)」을 완벽히 숙지한 전문 CS 행정 및 장학생 상담 에이전트이다.

아래에 제공되는 공식 가이드라인 지식 베이스를 바탕으로 장학생 또는 상담원의 질문에 답변하라.
절대로 허위 정보를 지어내거나(Hallucination) 가이드라인에 없는 내용을 추측하지 말라.
문서에 명시된 사실과 규정에 기반하여 정확하게 응답해야 한다.

[공식 가이드라인 데이터]:
${JSON.stringify(guidelineData, null, 2)}

[응답 규칙]:
1. answer: 고객(장학생)에게 친절하고 정중하게 전달할 수 있는 공식 답변 문장입니다. 필요한 핵심 정보와 이유를 분명하게 작성하세요.
2. manual: CS 담당자 또는 학생이 실제로 취해야 할 구체적인 실무 행정 절차를 1단계, 2단계 형태로 분리한 문자열 배열입니다.
3. source_pages: 가이드라인 문서 내에서 해당 내용이 명시되어 있는 실제 페이지 번호(정수 배열, 예: [4, 30])입니다.
4. section: 해당 내용이 위치한 목차/규정 항목명입니다 (예: "장학 프로그램 공통사항 > 학적 변동", "전공활동 장학금 > 국제 학술대회 장학금").
5. evidence: 가이드라인 문서에 그대로 기재된 핵심 원문 문장 발췌입니다.
6. contact: 해당 문의 처리 시 필요한 담당 부서명과 연락처/이메일.

반드시 다음 JSON 규격으로만 응답하라. 마크다운 코드블록이나 불필요한 설명 없이 순수 JSON 객체만 반환하라.
{
  "answer": "...",
  "manual": ["...", "..."],
  "source_pages": [1, 2],
  "section": "...",
  "evidence": "...",
  "contact": "..."
}
`;

    // 사용할 Gemini 최신 활성 모델 목록 (우선순위 순)
    const candidateModels = [
      "gemini-3.5-flash",
      "gemini-3.8-flash",
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
          lastError = `${modelName} (${response.status}): ${errText}`;
          continue; // 다음 후보 모델로 시도
        }

        const data = await response.json();
        let rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawContent) {
          throw new Error("모델 응답에 내용이 없습니다.");
        }

        // 혹시 모를 마크다운 코드블록 제거
        rawContent = rawContent.replace(/```json/g, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(rawContent);
        return NextResponse.json(parsed);
      } catch (e: any) {
        lastError = `${modelName} 처리 오류: ${e.message}`;
      }
    }

    return NextResponse.json(
      { error: `Gemini API 호출에 실패했습니다. (${lastError})` },
      { status: 500 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "서버 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
