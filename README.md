# 현대차 정몽구 스칼러십 장학생 CS 도우미

사용자가 제공한 **「2026년 7월 개정 현대차 정몽구 스칼러십 장학생 가이드 라인 (총 31페이지)」** 문서를 기반으로, 고객(장학생) 및 상담원 문의에 대해 **정확한 답변**, **단계별 행정/학생 처리 매뉴얼**, **가이드라인 내 해당 페이지 번호(근거 출처)**를 자동으로 제시하는 CS 도우미 웹 애플리케이션입니다.

---

## 🌟 주요 기능

1. **공식 가이드라인 1~31페이지 지식 탑재**:
   - 장학 프로그램 공통사항, 의무사항, 중복수혜 가능/불가 기준표 (p.4~5)
   - 부문별 지원금액, 지급일정(2/25, 8/25), 심사 기준 (p.6~10)
   - 해외진출 장학생 국가군(가·나·다군)별 지원금액 (p.12~15)
   - 글로벌 우수 장학금 Level 1~3 기준 및 국제학술대회 인정 3대 요건 (p.16~19)
   - 국제 콩쿠르 지원 및 재단 인정 콩쿠르 183개 목록 (p.20~28)
   - 휴·복학, 자퇴/편입, 초과학기, 교환학생 파견 처리 FAQ (p.29~31)
2. **3단계 분리 출력**:
   - **고객 응대용 공식 답변**: 친절하고 정중한 안내 문구 (원클릭 복사 기능)
   - **행정 및 학생 처리 매뉴얼**: 1단계, 2단계 형태의 구체적 실행 지침
   - **출처 페이지 뱃지**: 실제 PDF 내 페이지 번호 (예: 4p, 30p)
   - **원문 발췌 보기**: 해당 규정의 실제 문구 토글 확인
3. **편리한 API 키 연동**:
   - `.env.local` 파일 또는 웹 화면 상단 [API 키 설정] 모달에서 손쉽게 변경 가능

---

## 🚀 로컬 실행 방법

```bash
# 의존성 설치
npm install

# 환경 변수 설정 (.env.local 생성 후 GEMINI_API_KEY 입력)
# 또는 웹 브라우저에서 직접 입력 가능

# 로컬 개발 서버 시작
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속.

---

## 🌐 GitHub 푸시 및 Vercel 무료 배포 가이드

### 1. GitHub 레포지토리에 푸시하기
1. [GitHub](https://github.com/)에 로그인 후 우측 상단 `+` 버튼 -> **New repository** 클릭
2. Repository name 입력 (예: `cmk-cs-helper`) 후 **Create repository** 클릭
3. 터미널(VS Code 또는 PowerShell)에서 아래 명령어 실행:
```bash
git init
git add .
git commit -m "Initial commit: 현대차 정몽구 스칼러십 CS 에이전트"
git branch -M main
git remote add origin https://github.com/당신의깃허브아이디/cmk-cs-helper.git
git push -u origin main
```

### 2. Vercel 원클릭 무료 배포 (HTTPS)
1. [Vercel](https://vercel.com/)에 접속하여 GitHub 계정으로 로그인합니다.
2. **Add New...** -> **Project** 클릭
3. 방금 푸시한 `cmk-cs-helper` 레포지토리 옆의 **Import** 버튼 클릭
4. **Environment Variables** 항목을 펼친 후 아래 환경 변수 추가:
   - **Key**: `GEMINI_API_KEY`
   - **Value**: 발급받으신 Gemini API 키 (`AIzaSy...`)
5. 파란색 **Deploy** 버튼 클릭!
6. 약 1분 후 배포가 완료되며, `https://cmk-cs-helper-xxx.vercel.app` 형태의 무료 웹 주소가 생성됩니다.
