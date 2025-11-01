/**
 * Secure configuration for Thai Exotic Plant Project
 * -----------------------------------------------
 * 이 파일은 Facebook API, 서버 포트, 환경설정 등을 안전하게 관리하기 위한 설정입니다.
 * 
 * ❗ 절대 이 파일에 시크릿(Secret) 값을 직접 넣지 마세요.
 * 모든 민감정보는 .env 파일 또는 운영환경 변수로 관리하세요.
 */

require('dotenv').config();

/**
 * Helper function — production 환경에서 필수 ENV 누락 시 서비스 중단
 */
function requireEnvVar(key) {
  if (process.env.NODE_ENV === 'production' && !process.env[key]) {
    throw new Error(`[CONFIG ERROR] Missing required environment variable: ${key}`);
  }
}

/**
 * 필수 ENV 검증
 */
requireEnvVar('FACEBOOK_APP_ID');
requireEnvVar('FACEBOOK_APP_SECRET');
requireEnvVar('FACEBOOK_REDIRECT_URI');

/**
 * 환경설정 객체
 */
const config = {
  facebook: {
    appId: process.env.FACEBOOK_APP_ID,
    appSecret: process.env.FACEBOOK_APP_SECRET,
    redirectUri:
      process.env.FACEBOOK_REDIRECT_URI ||
      'http://localhost:3000/auth/facebook/callback',
    /**
     * scope 설정 — 필요 시 확장 가능
     * (예: pages_manage_posts, pages_read_engagement 등)
     * Facebook 개발자 페이지에서 승인된 scope만 추가하세요.
     */
    scope: process.env.FACEBOOK_SCOPE || 'pages_show_list',
    version: process.env.FACEBOOK_VERSION || 'v19.0',
  },

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  },

  paypal: {
    clientId: process.env.PAYPAL_CLIENT_ID,
    clientSecret: process.env.PAYPAL_CLIENT_SECRET,
    mode: process.env.PAYPAL_MODE || 'sandbox', // 'sandbox' or 'live'
  },

  server: {
    port: parseInt(process.env.PORT, 10) || 3000,
    environment: process.env.NODE_ENV || 'development',
  },
};

/**
 * 개발환경 로그
 */
if (config.server.environment !== 'production') {
  console.log('⚙️ Loaded configuration:');
  console.log(` - Facebook App ID: ${config.facebook.appId || '(not set)'}`);
  console.log(` - Redirect URI: ${config.facebook.redirectUri}`);
  console.log(` - Stripe Secret Key: ${config.stripe.secretKey ? '***' + config.stripe.secretKey.slice(-4) : '(not set)'}`);
  console.log(` - PayPal Client ID: ${config.paypal.clientId || '(not set)'}`);
  console.log(` - PayPal Mode: ${config.paypal.mode}`);
  console.log(` - Server port: ${config.server.port}`);
  console.log(` - Environment: ${config.server.environment}`);
  console.log('---------------------------------------------');
}

/**
 * 안전한 설정 객체 내보내기
 */
module.exports = config;

