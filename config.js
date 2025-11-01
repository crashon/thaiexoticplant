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

  shipping: {
    carriers: {
      CJ: {
        code: 'CJ',
        name: 'CJ대한통운',
        nameEn: 'CJ Logistics',
        trackingUrl: 'https://www.cjlogistics.com/ko/tool/parcel/tracking',
        apiUrl: process.env.CJ_API_URL,
        apiKey: process.env.CJ_API_KEY,
      },
      HANJIN: {
        code: 'HANJIN',
        name: '한진택배',
        nameEn: 'Hanjin Express',
        trackingUrl: 'https://www.hanjin.com/kor/CMS/DeliveryMgr/WaybillResult.do',
        apiUrl: process.env.HANJIN_API_URL,
        apiKey: process.env.HANJIN_API_KEY,
      },
      LOTTE: {
        code: 'LOTTE',
        name: '롯데택배',
        nameEn: 'Lotte Global Logistics',
        trackingUrl: 'https://www.lotteglogis.com/home/reservation/tracking/linkView',
        apiUrl: process.env.LOTTE_API_URL,
        apiKey: process.env.LOTTE_API_KEY,
      },
      LOGEN: {
        code: 'LOGEN',
        name: '로젠택배',
        nameEn: 'Logen',
        trackingUrl: 'https://www.ilogen.com/web/personal/trace',
        apiUrl: process.env.LOGEN_API_URL,
        apiKey: process.env.LOGEN_API_KEY,
      },
      KDEXP: {
        code: 'KDEXP',
        name: '경동택배',
        nameEn: 'KD Express',
        trackingUrl: 'https://kdexp.com/newDeliverySearch.kd',
        apiUrl: process.env.KDEXP_API_URL,
        apiKey: process.env.KDEXP_API_KEY,
      },
      CVSNET: {
        code: 'CVSNET',
        name: 'GS Postbox 택배',
        nameEn: 'CVSNet',
        trackingUrl: 'https://www.cvsnet.co.kr/invoice/tracking.do',
        apiUrl: process.env.CVSNET_API_URL,
        apiKey: process.env.CVSNET_API_KEY,
      },
      EPOST: {
        code: 'EPOST',
        name: '우체국택배',
        nameEn: 'Korea Post',
        trackingUrl: 'https://service.epost.go.kr/trace.RetrieveDomRigiTraceList.comm',
        apiUrl: process.env.EPOST_API_URL,
        apiKey: process.env.EPOST_API_KEY,
      },
    },
    defaultCarrier: 'CJ',
    autoUpdateInterval: parseInt(process.env.SHIPPING_UPDATE_INTERVAL, 10) || 3600000, // 1 hour
  },

  inventory: {
    lowStockThreshold: parseInt(process.env.LOW_STOCK_THRESHOLD, 10) || 10,
    criticalStockThreshold: parseInt(process.env.CRITICAL_STOCK_THRESHOLD, 10) || 5,
    outOfStockThreshold: parseInt(process.env.OUT_OF_STOCK_THRESHOLD, 10) || 0,
    checkInterval: parseInt(process.env.INVENTORY_CHECK_INTERVAL, 10) || 1800000, // 30 minutes
    notificationCooldown: parseInt(process.env.NOTIFICATION_COOLDOWN, 10) || 86400000, // 24 hours
    enableEmailNotifications: process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true',
    enableSMSNotifications: process.env.ENABLE_SMS_NOTIFICATIONS === 'true',
    adminEmails: (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean),
    adminPhones: (process.env.ADMIN_PHONES || '').split(',').map(p => p.trim()).filter(Boolean),
  },

  email: {
    service: process.env.EMAIL_SERVICE || 'gmail',
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
  },

  sms: {
    provider: process.env.SMS_PROVIDER || 'twilio', // twilio, aws-sns, etc.
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    fromNumber: process.env.TWILIO_FROM_NUMBER,
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

