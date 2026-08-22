# Android 앱 빌드 가이드 (Capacitor + Vercel)

## 개요

mingisa-crew는 Next.js로 만든 웹앱을 Capacitor를 이용해 Android 앱으로 래핑합니다.
API 라우트가 있어 정적 export가 불가능하므로 **Server URL 모드**를 사용합니다.
앱은 `crew.mingisa.com`을 WebView로 로드하며, 웹 배포만 해도 앱에 바로 반영됩니다.

## 구조

```
웹 수정 → Vercel 배포 → 앱 자동 반영 (APK 재빌드 불필요)
```

네이티브 설정(아이콘, 권한, 플러그인 등)을 바꿀 때만 APK 재빌드가 필요합니다.

## 초기 세팅 (최초 1회)

### 1. Capacitor 설정

`capacitor.config.ts`에 server URL 지정:

```ts
const config: CapacitorConfig = {
  appId: 'com.mingisa.crew',
  appName: 'mingisa-crew',
  webDir: 'out',
  server: {
    url: 'https://crew.mingisa.com',
    cleartext: false,
  },
};
```

### 2. Android 프로젝트 초기화

```bash
npx cap add android
mkdir -p android/app/src/main/assets
npx cap sync android
```

### 3. Android Studio에서 열기

```bash
npx cap open android
```

## Android Studio에서 빌드 & 실행

### 에뮬레이터 생성 (최초 1회)

1. `View → Tool Windows → Device Manager`
2. `+` → `Create Virtual Device`
3. Pixel 8 선택 → Next
4. API 37 선택 (없으면 Download) → Next → Finish
5. 생성된 에뮬레이터 옆 ▶ 클릭해서 시작

> 에뮬레이터 이미지 다운로드가 약 2GB로 시간이 걸립니다.

### 앱 실행

1. Gradle sync 완료 대기 (하단 진행바)
2. 상단 **Run app** 클릭
3. 에뮬레이터 또는 연결된 실기기 선택

## 네이티브 설정 변경 시

`capacitor.config.ts` 등 네이티브 관련 설정 변경 후:

```bash
npx cap sync android
```

이후 Android Studio에서 재빌드.

## Play Store 배포

추후 작성 예정.
