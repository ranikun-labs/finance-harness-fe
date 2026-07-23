import type { CapacitorConfig } from '@capacitor/cli';

// P0: 공식 reverse-domain appId가 아직 확정되지 않았다.
// appId 확정 후에만 이 파일에 `appId` 필드를 추가하고,
// 그 다음에만 `pnpm cap:add:ios` / `pnpm cap:add:android`를 실행할 것.
const config: CapacitorConfig = {
  appName: 'AI 투자 체크리스트',
  webDir: 'dist',
  android: {
    // 'debug': 디버그 빌드에서만 로그 출력 (안전한 기본값)
    // 'production': 빌드 타입과 무관하게 항상 로그 출력 — 출시 빌드에서 로그가
    //               노출되므로 절대 사용하지 않는다.
    loggingBehavior: 'debug',
  },
};

export default config;
