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
            "Gemini API 키가 설정되지 않았습니다. 상단 설정 메뉴에서 API 키를 입력하거나 .env.local 환경 변수에 등록해 주세요.",
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
2. manual: CS 담당자 또는 학생이 실제로 취해야 할 구체적인 실무 행정 절차를 1단계, 2단계 형태로 분리한 문자열 배열입니다. (예: ["정몽구 스칼러십 홈페이지 로그인 후 마이페이지 > [전공활동지원] 신청", "지도교수 추천서 원본을 재단 이메일(cmk_scholarship@naver.com)로 별도 접수", "대회 종료 후 1개월 이내 결과보고서(A4 4매 이상) 및 정산 영수증 제출"])
3. source_pages: 가이드라인 문서 내에서 해당 내용이 명시되어 있는 실제 페이지 번호(정수 배열, 예: [4, 30])입니다.
4. section: 해당 내용이 위치한 목차/규정 항목명입니다 (예: "장학 프로그램 공통사항 > 학적 변동", "전공활동 장학금 > 국제 학술대회 장학금").
5. evidence: 가이드라인 문서에 그대로 기재된 핵심 원문 문장 발췌입니다.
6. contact: 해당 문의 처리 시 필요한 담당 부서명과 연락처/이메일(필요 시 기재).

반드시 다음 JSON 규격으로만 응답하라. Markdown 코드 블록(\`\`\`json) 없이 순수 JSON 문자열만 출력해야 한다.
{
  "answer": "...",
  "manual": ["...", "..."],
  "source_pages": [1, 2],
  "section": "...",
  "evidence": "...",
  "contact": "..."
}
`;

    // Gemini API 호출 (최신 2.5 Flash / 1.5 Flash 호환)
    const modelName = "gemini-2.5-flash";
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
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
      const errorText = await response.text();
      // gemini-2.5-flash가 아직 지원 안되는 키일 경우 gemini-1.5-flash로 fallback
      if (response.status === 404 || errorText.includes("not found")) {
        const fallbackEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        const fallbackRes = await fetch(fallbackEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: `고객/장학생 문의: "${question}"` }],
              },
            ],
            systemInstruction: { parts: [{ text: systemInstruction }] },
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.1,
            },
          }),
        });

        if (!fallbackRes.ok) {
          const fallbackErr = await fallbackRes.text();
          return NextResponse.json(
            { error: `Gemini API 오류: ${fallbackErr}` },
            { status: fallbackRes.status }
          );
        }

        const fbData = await fallbackRes.json();
        const rawContent = fbData.candidates?.[0]?.content?.parts?.[0]?.text;
        const parsed = JSON.parse(rawContent);
        return NextResponse.json(parsed);
      }

      return NextResponse.json(
        { error: `Gemini API 호출 실패 (${response.status}): ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsed = JSON.parse(rawContent);

    return NextResponse.json(parsed);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "서버 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
