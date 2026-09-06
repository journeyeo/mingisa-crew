import { redirect } from "next/navigation";

const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.mingisa.crew";

export default function Home() {
  if (process.env.APP_LAUNCH_MODE !== "true") {
    redirect("/airport");
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-6">
      <div className="max-w-sm w-full text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">민기사 크루</h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            인천·김포공항 실시간 입국 현황 앱입니다.<br />
            앱을 설치하고 이용해 주세요.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <a
            href={PLAY_STORE_URL}
            className="block w-full py-3.5 rounded-2xl bg-gray-900 text-white text-sm font-semibold text-center"
          >
            Google Play 다운로드
          </a>
        </div>

        <p className="text-xs text-gray-300">기사님 전용 서비스입니다</p>
      </div>
    </main>
  );
}
