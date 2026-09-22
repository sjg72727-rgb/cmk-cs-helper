"use client";

import React, { useState, useEffect } from "react";
import {
  Send,
  BookOpen,
  FileCheck,
  HelpCircle,
  Copy,
  Check,
  Key,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Phone,
  Mail,
  Clock,
  Sparkles,
  RefreshCw,
} from "lucide-react";

interface CSResult {
  answer: string;
  manual: string[];
  source_pages: number[];
  section: string;
  evidence: string;
  contact?: string;
}

interface MessageHistory {
  question: string;
  result: CSResult;
  timestamp: string;
}

const SAMPLE_QUESTIONS = [
  "군 휴학을 하려고 하는데 장학금 반환해야 하나요?",
  "해외 학술대회 구두발표 시 항공비와 숙박비는 얼마까지 지원되나요?",
  "교환학생 파견 시 장학금은 유지되나요? 네트워킹은 어떻게 대체하나요?",
  "타 재단 장학금이나 교내 장학금과 중복 수혜 가능한가요?",
  "글로벌 우수 장학금 Level 1 기준과 지원 금액은 어떻게 되나요?",
  "대학원 석박사 통합과정에서 석사로 중도 전환하면 어떻게 처리되나요?",
];

export default function Home() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentResult, setCurrentResult] = useState<CSResult | null>(null);
  const [history, setHistory] = useState<MessageHistory[]>([]);
  const [apiKey, setApiKey] = useState("");
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showEvidence, setShowEvidence] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 로컬 스토리지에서 API 키 불러오기
  useEffect(() => {
    const saved = localStorage.getItem("cmk_gemini_api_key");
    if (saved) {
      setApiKey(saved);
    }
  }, []);

  const saveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem("cmk_gemini_api_key", key);
    setShowKeyModal(false);
  };

  const handleAsk = async (queryText?: string) => {
    const targetQ = queryText || question;
    if (!targetQ.trim()) return;

    setLoading(true);
    setErrorMsg(null);
    setShowEvidence(false);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: targetQ,
          userApiKey: apiKey || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "답변을 불러오지 못했습니다.");
      }

      setCurrentResult(data);
      setHistory((prev) => [
        {
          question: targetQ,
          result: data,
          timestamp: new Date().toLocaleTimeString("ko-KR", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
        ...prev,
      ]);
      setQuestion("");
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAnswer = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      {/* 상단 네비게이션 */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-[#0A2F6E] flex items-center justify-center text-white font-bold text-lg shadow">
              CMK
            </div>
            <div>
              <h1 className="font-bold text-slate-900 text-base sm:text-lg tracking-tight">
                현대차 정몽구 스칼러십 CS 도우미
              </h1>
              <div className="flex items-center space-x-2 text-xs text-slate-500">
                <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-medium border border-blue-200">
                  2026년 7월 개정 가이드라인 (31p 완벽 반영)
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowKeyModal(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100"
            >
              <Key className="w-3.5 h-3.5" />
              <span>{apiKey ? "사용자 키 등록됨" : "API 자동 연결됨"}</span>
            </button>

            <a
              href="https://www.cmkfoundation-scholarship.org"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-[#0A2F6E] hover:bg-slate-100 transition-colors border border-slate-200"
            >
              <span>재단 홈페이지</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 영역 */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-6">
        {/* 질문 입력 박스 */}
        <section className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            장학생 또는 상담 문의 내용을 입력해 주세요
          </label>
          <div className="relative">
            <textarea
              rows={3}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleAsk();
                }
              }}
              placeholder="예: 군 휴학 시 장학금은 어떻게 처리되며 복학하면 다시 받을 수 있나요?"
              className="w-full rounded-xl border border-slate-300 p-3.5 pr-28 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0A2F6E] focus:border-transparent text-sm resize-none"
            />
            <button
              onClick={() => handleAsk()}
              disabled={loading || !question.trim()}
              className="absolute right-3 bottom-3.5 px-4 py-2 bg-[#0A2F6E] text-white rounded-lg text-sm font-medium hover:bg-blue-900 disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center space-x-1.5 transition-all shadow"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>분석 중...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>문의하기</span>
                </>
              )}
            </button>
          </div>

          {/* 자주 묻는 질문 퀵 칩 */}
          <div className="mt-4 pt-3 border-t border-slate-100">
            <div className="text-xs text-slate-500 font-medium mb-2 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>자주 묻는 질문 빠른 선택:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_QUESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuestion(q);
                    handleAsk(q);
                  }}
                  className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 text-slate-600 rounded-full border border-slate-200 transition-all text-left"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* 에러 메시지 알림 */}
        {errorMsg && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3 text-red-800 text-sm">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">오류가 발생했습니다</p>
              <p className="text-xs text-red-700 mt-0.5">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* 결과 카드 */}
        {currentResult && (
          <div className="flex flex-col gap-5 animate-in fade-in duration-300">
            {/* 상단 메타 바: 출처 페이지 및 해당 섹션 */}
            <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl p-4 sm:p-5 shadow flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs uppercase tracking-wider text-blue-200 font-semibold">
                  가이드라인 규정 근거
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5">
                  {currentResult.section}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-blue-200">명시 페이지:</span>
                <div className="flex gap-1.5">
                  {currentResult.source_pages.map((p, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-white/20 hover:bg-white/30 backdrop-blur rounded-lg text-sm font-black text-amber-300 border border-white/30 tracking-wide"
                    >
                      {p}페이지
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* 3단 분할 레이아웃: 답변 / 매뉴얼 / 원문 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* 1. 고객 응대용 답변 카드 */}
              <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200 flex flex-col">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                  <div className="flex items-center space-x-2 text-[#0A2F6E]">
                    <HelpCircle className="w-5 h-5" />
                    <h4 className="font-bold text-slate-900 text-base">
                      고객 응대용 표준 답변
                    </h4>
                  </div>
                  <button
                    onClick={() => handleCopyAnswer(currentResult.answer)}
                    className="flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">복사완료</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>답변 복사</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="text-slate-800 text-sm leading-relaxed whitespace-pre-line flex-1 bg-blue-50/40 p-4 rounded-xl border border-blue-100/70">
                  {currentResult.answer}
                </div>
              </div>

              {/* 2. 실무 및 장학생 처리 매뉴얼 */}
              <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200 flex flex-col">
                <div className="flex items-center space-x-2 text-emerald-700 mb-3 pb-2 border-b border-slate-100">
                  <FileCheck className="w-5 h-5" />
                  <h4 className="font-bold text-slate-900 text-base">
                    행정 및 학생 처리 매뉴얼 (Action Items)
                  </h4>
                </div>
                <div className="space-y-2.5 flex-1">
                  {currentResult.manual.map((step, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3 bg-emerald-50/40 border border-emerald-100 rounded-xl"
                    >
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <p className="text-xs sm:text-sm text-slate-800 font-medium leading-normal pt-0.5">
                        {step}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. 가이드라인 원문 근거 (접기/펼치기) */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
              <button
                onClick={() => setShowEvidence(!showEvidence)}
                className="w-full flex items-center justify-between text-left"
              >
                <div className="flex items-center space-x-2 text-slate-700">
                  <BookOpen className="w-4 h-4 text-blue-700" />
                  <span className="font-bold text-sm text-slate-900">
                    가이드라인 원문 조항 확인하기 (PDF{" "}
                    {currentResult.source_pages.join(", ")}페이지 발췌)
                  </span>
                </div>
                {showEvidence ? (
                  <ChevronUp className="w-4 h-4 text-slate-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                )}
              </button>

              {showEvidence && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <blockquote className="p-3 bg-slate-50 rounded-xl border-l-4 border-blue-600 text-xs text-slate-700 leading-relaxed italic font-mono">
                    {currentResult.evidence}
                  </blockquote>
                </div>
              )}
            </div>

            {/* 4. 문의처 안내 바 */}
            <div className="bg-slate-100 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 gap-3">
              <div className="flex items-center gap-4 flex-wrap">
                <span className="font-semibold text-slate-800 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-blue-600" /> 운영사무국:
                  02-6958-1947
                </span>
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-blue-600" /> 이메일:
                  ondreamimpact@univ.me
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-blue-600" /> 운영시간: 평일
                  10:00~17:00
                </span>
              </div>
              <span className="text-slate-500 text-[11px]">
                ※ 장학생 본인 직접 문의 원칙 (학부모 대리 불가)
              </span>
            </div>
          </div>
        )}

        {/* 이전 문의 히스토리 */}
        {history.length > 1 && (
          <section className="mt-8">
            <h3 className="text-sm font-bold text-slate-700 mb-3">
              이전 상담 내역 ({history.length - 1}건)
            </h3>
            <div className="space-y-2">
              {history.slice(1).map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setCurrentResult(item.result);
                  }}
                  className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-sm cursor-pointer transition flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3 truncate">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                      {item.result.source_pages.join(", ")}p
                    </span>
                    <span className="text-sm text-slate-800 truncate font-medium">
                      {item.question}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 shrink-0 ml-3">
                    {item.timestamp}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* API Key 설정 모달 */}
      {showKeyModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center space-x-2 text-[#0A2F6E] mb-3">
              <Key className="w-5 h-5" />
              <h3 className="font-bold text-slate-900 text-lg">
                Google Gemini API 키 설정
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Google AI Studio에서 발급받은 API 키를 입력해 주세요. 입력하신
              키는 브라우저 로컬 저장소에만 보관되며 안전하게 호출됩니다.
              (Vercel에 배포할 때는 Vercel 환경 변수에 영구 등록됩니다.)
            </p>
            <input
              type="password"
              defaultValue={apiKey}
              placeholder="AIzaSy..."
              id="api-key-input"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-[#0A2F6E] focus:outline-none mb-4"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowKeyModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100"
              >
                닫기
              </button>
              <button
                onClick={() => {
                  const input = document.getElementById(
                    "api-key-input"
                  ) as HTMLInputElement;
                  saveApiKey(input?.value || "");
                }}
                className="px-4 py-2 rounded-lg text-xs font-medium bg-[#0A2F6E] text-white hover:bg-blue-900 shadow"
              >
                저장하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 푸터 */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-400">
        <div className="max-w-6xl mx-auto px-4">
          현대차 정몽구 스칼러십 장학생 가이드라인 CS Helper • 현대차 정몽구
          재단 2026.07 개정안 기준
        </div>
      </footer>
    </div>
  );
}
