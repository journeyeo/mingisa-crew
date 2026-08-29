export const metadata = { title: "개인정보처리방침 — 밍기사 크루" };

export default function PrivacyPage() {
  return (
    <main className="max-w-2xl mx-auto px-6 py-12 text-gray-600">
      <h1 className="text-2xl font-bold mb-2 text-gray-800">개인정보처리방침</h1>
      <p className="text-sm text-gray-400 mb-8">최종 수정일: 2026년 8월 29일</p>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-2 text-gray-700">1. 수집하는 개인정보</h2>
        <p className="text-sm leading-relaxed">
          밍기사 크루(이하 "앱")는 인천공항·김포공항 운항 정보 및 날씨 정보를 제공하는 서비스입니다.
          앱은 사용자의 개인정보를 수집하거나 저장하지 않습니다.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-2 text-gray-700">2. 제3자 API 사용</h2>
        <p className="text-sm leading-relaxed">
          앱은 공공데이터포털(data.go.kr) 및 기상청 API를 통해 공개 정보를 조회합니다.
          해당 API 호출은 서버 측에서 이루어지며, 사용자 식별 정보는 전송되지 않습니다.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-2 text-gray-700">3. 로그 및 분석</h2>
        <p className="text-sm leading-relaxed">
          앱은 별도의 사용자 행동 분석 도구나 광고 SDK를 사용하지 않습니다.
          Vercel 호스팅 플랫폼의 기본 서버 로그(IP, 요청 경로 등)가 일시적으로 기록될 수 있으나,
          개인 식별 목적으로 사용되지 않습니다.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-2 text-gray-700">4. 아동 개인정보 보호</h2>
        <p className="text-sm leading-relaxed">
          앱은 만 14세 미만 아동을 대상으로 하지 않으며, 아동의 개인정보를 의도적으로 수집하지 않습니다.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-2 text-gray-700">5. 문의</h2>
        <p className="text-sm leading-relaxed">
          개인정보처리방침에 관한 문의는 아래 이메일로 연락해 주세요.
        </p>
        <p className="text-sm mt-2 font-medium">jiyoun.labs@gmail.com</p>
      </section>
    </main>
  );
}
