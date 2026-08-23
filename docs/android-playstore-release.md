# Android 앱 빌드 및 Play Store 출시 과정

## 1. APK 빌드 (테스트용)

```bash
cd android && ./gradlew assembleDebug
# 결과: android/app/build/outputs/apk/debug/app-debug.apk
```

### USB로 폰에 직접 설치
```bash
# 기기 연결 확인
~/Library/Android/sdk/platform-tools/adb devices

# 설치 (-s 옵션으로 기기 지정)
~/Library/Android/sdk/platform-tools/adb -s [기기ID] install -r app-debug.apk

# 앱 실행
~/Library/Android/sdk/platform-tools/adb -s [기기ID] shell monkey -p com.mingisa.crew -c android.intent.category.LAUNCHER 1
```

### 폰 설정
- **USB 디버깅**: 개발자 옵션에서 활성화 필요
- **USB 모드**: 파일 전송 또는 USB 디버깅 모드 선택

### APK 파일로 직접 설치 (카카오톡 전송)
1. APK를 카카오톡으로 전송 (직접 전송 안 되면 zip 압축 후 전송)
2. 폰에서 파일 열기
3. "출처를 알 수 없는 앱 허용" → 설치
4. (처음 한 번만 허용하면 이후 바로 설치)

---

## 2. 앱 아이콘 설정

### 아이콘 생성 (sharp 사용)
```js
// node 스크립트로 모든 사이즈 자동 생성
// ic_launcher (흰 배경), ic_launcher_round, ic_launcher_foreground (투명 배경)
const sizes = [
  { dir: 'mipmap-mdpi',    fg: 108, icon: 48 },
  { dir: 'mipmap-hdpi',    fg: 162, icon: 72 },
  { dir: 'mipmap-xhdpi',   fg: 216, icon: 96 },
  { dir: 'mipmap-xxhdpi',  fg: 324, icon: 144 },
  { dir: 'mipmap-xxxhdpi', fg: 432, icon: 192 },
];
// foreground: 원본 이미지 75% 크기 + 투명 패딩
// ic_launcher: 원본 이미지 75% 크기 + 흰 배경
```

### 아이콘 배경색 변경
- `android/app/src/main/res/values/ic_launcher_background.xml`
- `#FFFFFF` → `#2D2D2F` (스플래시 색상과 통일)

---

## 3. 스플래시 화면 설정 (Android 12+)

`android/app/src/main/res/values/styles.xml`:
```xml
<style name="AppTheme.NoActionBarLaunch" parent="Theme.SplashScreen">
    <item name="windowSplashScreenBackground">#2D2D2F</item>
    <item name="windowSplashScreenAnimatedIcon">@mipmap/ic_launcher_foreground</item>
    <item name="postSplashScreenTheme">@style/AppTheme.NoActionBar</item>
</style>

<style name="AppTheme.NoActionBar" parent="Theme.AppCompat.DayNight.NoActionBar">
    <item name="windowActionBar">false</item>
    <item name="windowNoTitle">true</item>
    <item name="android:windowBackground">#2D2D2F</item>
</style>
```

> ⚠️ Android 12+는 `@drawable/splash` 방식이 아닌 테마 속성으로 제어

---

## 4. Pull-to-refresh 구현

`android/app/src/main/java/com/mingisa/crew/MainActivity.java`:
```java
// SwipeRefreshLayout을 WebView 위에 프로그래밍 방식으로 추가
WebView webView = this.bridge.getWebView();
webView.setBackgroundColor(Color.TRANSPARENT);
ViewGroup parent = (ViewGroup) webView.getParent();

SwipeRefreshLayout swipeRefresh = new SwipeRefreshLayout(this);
swipeRefresh.setColorSchemeColors(0xFF1B5E36); // 딥그린

int index = parent.indexOfChild(webView);
parent.removeView(webView);
swipeRefresh.addView(webView);
parent.addView(swipeRefresh, index);

swipeRefresh.setOnRefreshListener(() -> {
    webView.reload();
    swipeRefresh.setRefreshing(false);
});

// 최상단에서만 pull-to-refresh 활성화
webView.setOnScrollChangeListener((v, scrollX, scrollY, oldScrollX, oldScrollY) ->
    swipeRefresh.setEnabled(scrollY == 0)
);
```

`build.gradle` 의존성 추가:
```gradle
implementation "androidx.swiperefreshlayout:swiperefreshlayout:1.1.0"
```

---

## 5. 내비게이션 바 설정

```java
// MainActivity.java
getWindow().setNavigationBarColor(Color.TRANSPARENT);
if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
    getWindow().getInsetsController().setSystemBarsAppearance(
        WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS,
        WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS
    );
}
```

> 앱 배경이 흰색이면 APPEARANCE_LIGHT_NAVIGATION_BARS 설정 (버튼 어둡게)

---

## 6. AAB 빌드 (Play Store용)

```bash
cd android && ./gradlew bundleRelease
# 결과: android/app/build/outputs/bundle/release/app-release.aab
```

### 버전 업데이트
`android/app/build.gradle`:
```gradle
versionCode 2      # 업데이트마다 +1
versionName "1.1"  # 사용자에게 보이는 버전
```

### Keystore 정보
- 파일: `android/app/mingisa-crew.keystore`
- alias: `mingisa-crew`
- password: `mingisa2024`
- 유효기간: 10,000일

---

## 7. Play Store 등록

### 개발자 계정
- 계정: jiyoun.labs@gmail.com
- 타입: Yourself (개인)
- 등록비: $25 (1회)

### ⚠️ 개인 계정 주의사항
- 앱 출시 전 **비공개 테스트 필수**
- 12명 테스터 × 14일 사용 → Google 승인 → 프로덕션 출시
- 앱마다 반복 필요
- 조직 계정은 테스터 불필요 (즉시 출시 가능)

### 비공개 테스트 진행 방법
1. Play Console → 테스트 → 비공개 테스트
2. 테스트 링크 생성
3. 카카오톡으로 링크 공유
4. 12명 설치 + 14일 유지
5. Google에 프로덕션 출시 신청

### 스토어 등록 필요 자료
- 앱 설명 (한국어)
- 스크린샷 2~8장
- 앱 아이콘 512x512
- 피처드 이미지 1024x500 (선택)

### 업데이트 구분
- **웹만 변경** (UI, 기능): crew.mingisa.com 자동 반영, 앱 재배포 불필요
- **앱 자체 변경** (android 폴더): versionCode 올리고 AAB 재빌드 후 업로드
