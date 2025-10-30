Thai Exotic Plants - 태국 특이식물 전문 쇼핑몰

태국에서 직접 수집한 희귀하고 아름다운 특이식물을 한국으로 직배송하는 전문 온라인 쇼핑몰

## 🚀 빠른 시작

### 데이터베이스 설정 (Neon PostgreSQL)

1. **Neon 데이터베이스 생성**
   - https://neon.tech/ 에서 계정 생성
   - 새 프로젝트 생성
   - 데이터베이스 URL 복사

2. **환경 변수 설정**
   프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 입력하세요:
   ```bash
   # .env 파일 생성
   DATABASE_URL=postgresql://username:password@hostname:port/database?sslmode=require
   FACEBOOK_APP_ID=your_facebook_app_id
   FACEBOOK_APP_SECRET=your_facebook_app_secret
   FACEBOOK_REDIRECT_URI=http://localhost:3000/auth/facebook/callback
   FACEBOOK_SCOPE=pages_show_list
   PORT=3000
   NODE_ENV=development
   ```

   **Neon 데이터베이스 URL 찾는 방법:**
   1. Neon 대시보드에 로그인
   2. 프로젝트 선택
   3. "Connection Details" 클릭
   4. "Connection string" 복사
   5. `.env` 파일의 `DATABASE_URL`에 붙여넣기

   **데이터베이스 없이 테스트하기:**
   - `.env` 파일을 생성하지 않으면 fallback 데이터로 서버가 실행됩니다
   - 실제 데이터베이스 기능을 사용하려면 Neon 설정이 필요합니다

### 서버 실행하기

1. **의존성 설치**
   ```bash
   npm install
   ```

2. **보안 키 생성** (프로덕션 환경 필수)
   ```bash
   # JWT Secret 생성
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

   # Encryption Key 생성
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   생성된 값을 .env 파일의 JWT_SECRET과 ENCRYPTION_KEY에 입력하세요.

3. **서버 시작**
   ```bash
   npm start
   ```

4. **개발 모드 (자동 재시작)**
   ```bash
   npm run dev
   ```

5. **테스트 실행**
   ```bash
   npm test                # 모든 테스트 실행
   npm run test:watch      # 테스트 watch 모드
   npm run test:coverage   # 커버리지 리포트
   ```

6. **브라우저에서 접속**
   - 메인 페이지: http://localhost:3000
   - 샵 목록: http://localhost:3000/shops.html
   - 관리자: http://localhost:3000/admin.html

### API 엔드포인트

**인증 API (신규)**
- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인
- `GET /api/auth/me` - 현재 사용자 정보 (인증 필요)
- `PUT /api/auth/profile` - 프로필 업데이트 (인증 필요)

**상품 & 카테고리 API**
- `GET /tables/categories?limit=100` - 카테고리 목록
- `GET /tables/products?page=1&limit=20&sort=name` - 상품 목록 (페이지네이션, 검색, 정렬)

**주문 API (신규 개선)**
- `POST /api/orders` - 주문 생성 (재고 확인 및 차감 포함)
- `GET /tables/orders?limit=1000` - 주문 목록 (관리자)

**관리자 API**
- `POST /api/save-data` - 데이터 저장 (카테고리, 상품, 포스트 등)
- `GET /api/export-data` - 모든 데이터 내보내기
- `DELETE /api/media-items/:id` - 미디어 삭제
- `POST /api/media-items/bulk-delete` - 미디어 일괄 삭제

**소셜미디어 API**
- `GET /tables/social_posts?limit=100` - 소셜미디어 포스트 목록
- `GET /auth/facebook` - Facebook OAuth 시작
- `GET /auth/facebook/callback` - Facebook OAuth 콜백
- `POST /api/facebook/post` - Facebook 포스트 (관리자)

**샵 API**
- `GET /tables/shops?limit=100` - 샵 목록

### 데이터베이스 기능

**실제 데이터베이스 사용 시:**
- 모든 데이터가 PostgreSQL에 영구 저장됩니다
- 카테고리, 상품, 주문, 소셜 포스트, 샵, 미디어 아이템 관리
- 자동 데이터 마이그레이션 및 샘플 데이터 삽입
- 검색, 정렬, 페이지네이션 지원

**Fallback 모드 (데이터베이스 없이):**
- 메모리 기반 임시 데이터 사용
- 서버 재시작 시 데이터 초기화
- 기본적인 API 기능 제공

### Facebook API 설정

실제 Facebook 포스팅을 사용하려면 Facebook 앱을 생성해야 합니다:

1. **Facebook 개발자 계정 생성**
   - https://developers.facebook.com/ 에서 계정 생성

2. **새 앱 생성**
   - "내 앱" → "앱 만들기" → "비즈니스" 선택
   - 앱 이름: "Thai Exotic Plants" (또는 원하는 이름)
   - 연락처 이메일 입력

3. **Facebook 로그인 제품 추가**
   - 앱 대시보드에서 "제품 추가" → "Facebook 로그인" → "웹" 선택
   - "유효한 OAuth 리디렉션 URI"에 `http://localhost:3000/auth/facebook/callback` 추가

4. **앱 설정**
   - `config.js` 파일에서 Facebook 앱 정보 업데이트:
   ```javascript
   facebook: {
       appId: 'YOUR_FACEBOOK_APP_ID',
       appSecret: 'YOUR_FACEBOOK_APP_SECRET',
       redirectUri: 'http://localhost:3000/auth/facebook/callback'
   }
   ```

5. **권한 설정**
   - 현재는 기본 권한만 사용: `pages_show_list`
   - 이 권한으로 사용자의 페이지 목록을 조회하고, 페이지가 있으면 페이지에, 없으면 개인 타임라인에 포스팅합니다
   - 추가 권한이 필요한 경우 Facebook 개발자 콘솔에서 요청할 수 있습니다

6. **테스트**
   - 관리자 페이지에서 "Facebook 연결하기" 버튼 클릭
   - Facebook 로그인 후 권한 승인
   - 포스트 작성 및 게시 테스트

### 문제 해결

만약 API 오류가 발생하면, 서버가 실행 중인지 확인하세요. 서버가 없어도 기본 데이터로 웹사이트가 동작합니다.

🌱 프로젝트 개요
Thai Exotic Plants는 태국 현지에서 희귀한 특이식물을 수집하여 한국의 식물 애호가들에게 제공하는 전문 쇼핑몰입니다. 워드프레스 기반의 쇼핑 기능, 소셜미디어 자동화 시스템, 그리고 다중 샵 관리 기능을 갖춘 종합적인 전자상거래 플랫폼입니다.
주요 특징

🛒 종합 쇼핑몰: 상품 등록부터 주문 처리까지 완전한 전자상거래 시스템
🏪 다중 샵 관리: 여러 샵의 상품 및 운영 관리
📱 반응형 디자인: 모바일, 태블릿, 데스크톱 모든 기기에서 최적화된 사용자 경험
🤖 소셜미디어 자동화: 페이스북, 인스타그램, 트위터(X)에 자동 포스팅
📊 관리자 대시보드: 실시간 매출 분석, 상품/주문/샵 관리
🎥 미디어 관리: 이미지와 동영상 업로드 및 관리 시스템
🌏 다국어 지원: 한국어, 영어, 태국어 상품명 및 설명

🚀 현재 구현된 기능 및 추가 기능
## 🔐 보안 기능 (2025-10-30 업데이트)

### 새로 추가된 보안 기능
- ✅ **사용자 인증 시스템**: JWT 기반 회원가입/로그인
- ✅ **비밀번호 보안**: bcrypt 해싱 (saltRounds: 10)
- ✅ **토큰 암호화**: AES-256-CBC로 OAuth 토큰 암호화
- ✅ **Input Validation**: express-validator로 모든 입력 검증
- ✅ **Rate Limiting**: IP 기반 요청 제한
  - 일반 요청: 15분당 100회
  - 인증 요청: 15분당 5회
  - API 요청: 15분당 500회
- ✅ **XSS 방지**: escapeHtml 함수 추가
- ✅ **보안 헤더**: Helmet.js 적용
- ✅ **Error Handling**: 전역 에러 핸들러
- ✅ **404 핸들러**: 존재하지 않는 라우트 처리

### 테스트 커버리지
- ✅ Jest 테스트 프레임워크 설정
- ✅ API 엔드포인트 테스트
- ✅ Validation 테스트
- ✅ 유틸리티 함수 테스트
- ✅ E2E 시나리오 테스트

✅ 완료된 기능
1. 데이터베이스 시스템

상품 관리: 이름, 가격, 재고, 이미지, 동영상, 카테고리 관리
카테고리 시스템: 계층형 카테고리 구조 (희귀 아로이드, 다육식물, 관엽식물, 꽃식물)
주문 관리: 고객 정보, 결제 상태, 배송 추적
소셜미디어: 포스트 예약 및 자동 게시 관리
샵 관리 (신규):

샵 정보: 샵 이름, 설명, 연락처, 소유자 정보
샵과 상품 연결: 각 샵별로 상품 등록 및 관리
샵 오너 권한: 샵 소유자에게 상품 등록/수정 권한 부여



2. 사용자 인터페이스

메인 페이지: 히어로 섹션, 특징 소개, 상품 진열
상품 목록: 필터링, 정렬, 검색 기능
샵리스트 메뉴 (신규): 사용자 화면에서 샵별 목록 조회 및 필터링
상품 상세: 이미지 갤러리, 동영상, 상세 정보, 소속 샵 정보 표시
장바구니: 실시간 장바구니, 수량 조절
주문하기: 고객 정보 입력, 결제 정보

3. 관리자 시스템

대시보드: 매출 통계, 차트 분석
상품 관리: CRUD 기능, 대량 업로드
주문 관리: 주문 상태 변경, 배송 추적
카테고리 관리: 카테고리 생성, 수정, 삭제
샵 관리 (신규):

샵 리스트: 모든 샵 조회, 검색, 필터링
샵 추가: 새로운 샵 등록 (샵 이름, 설명, 소유자 지정)
샵 수정: 기존 샵 정보 수정
샵 삭제: 샵 및 관련 데이터 삭제 (상품 연동 확인 후 처리)
샵 오너 관리: 샵 소유자 계정 연결 및 권한 설정



4. 샵 오너 시스템 (신규)

샵 오너 대시보드:

자신의 샵 정보 조회 및 수정
샵별 상품 관리: 상품 추가, 수정, 삭제
샵별 매출 통계: 샵 내 상품의 판매 현황
재고 관리: 샵 내 상품의 재고 상태 확인 및 업데이트



5. 소셜미디어 자동화

플랫폼 연동: 페이스북, 인스타그램, 트위터(X)
자동 포스팅: 상품 기반 자동 컨텐츠 생성
예약 시스템: 날짜/시간 예약 포스팅
해시태그: 자동 해시태그 생성 및 관리
샵별 포스팅 (신규): 샵별 상품을 기반으로 한 소셜미디어 포스팅 생성

6. 미디어 관리

파일 업로드: 드래그 앤 드롭, 다중 파일 업로드
미디어 라이브러리: 이미지/동영상 관리
썸네일 생성: 자동 썸네일 및 미리보기
메타데이터: 파일명, 설명, 태그 관리

📂 프로젝트 구조 (업데이트)
textThai-Exotic-Plants/
├── index.html              # 메인 페이지
├── admin.html              # 관리자 대시보드
├── shop-owner.html         # 샵 오너 대시보드 (신규)
├── css/
│   └── style.css          # 커스텀 스타일
├── js/
│   ├── main.js            # 메인 애플리케이션 로직
│   ├── cart.js            # 장바구니 및 주문 시스템
│   ├── products.js        # 상품 관리 로직
│   ├── admin.js           # 관리자 기능
│   ├── shop.js            # 샵 관리 및 샵 오너 로직 (신규)
│   ├── social-media.js    # 소셜미디어 자동화
│   └── media-manager.js   # 미디어 관리 시스템
└── README.md              # 프로젝트 문서
🛠 기술 스택 (변경 없음)
Frontend

HTML5: 시맨틱 마크업
Tailwind CSS: 유틸리티 기반 CSS 프레임워크
Vanilla JavaScript: ES6+ 문법 활용
Chart.js: 데이터 시각화
Font Awesome: 아이콘 라이브러리

Backend (RESTful API)

RESTful Table API: 데이터 관리
LocalStorage: 클라이언트 사이드 저장
JSON: 데이터 교환 형식

외부 서비스 연동

소셜미디어 API: Facebook Graph API, Instagram Basic Display, Twitter API v2
결제 시스템: 추후 연동 예정
배송 추적: 추후 연동 예정

📋 데이터 모델 (업데이트)
상품 (Products)
javascript{
  id: string,              // 고유 ID
  shop_id: string,         // 소속 샵 ID (신규)
  name: string,            // 영문명
  korean_name: string,     // 한글명
  thai_name: string,       // 태국어명
  scientific_name: string, // 학명
  description: string,     // 상품 설명
  category_id: string,     // 카테고리 ID
  price: number,           // 가격 (THB)
  price_usd: number,       // 가격 (USD)
  stock_quantity: number,  // 재고 수량
  images: array,           // 이미지 URL 배열
  videos: array,           // 동영상 URL 배열
  difficulty_level: string, // 재배 난이도
  is_rare: boolean,        // 희귀종 여부
  is_featured: boolean,    // 추천 여부
  is_active: boolean       // 판매 활성화
}
주문 (Orders)
javascript{
  id: string,              // 주문 ID
  order_number: string,    // 주문번호
  shop_id: string,         // 소속 샵 ID (신규)
  customer_name: string,   // 고객명
  customer_email: string,  // 고객 이메일
  total_amount: number,    // 총 주문금액
  payment_status: string,  // 결제 상태
  order_status: string,    // 주문 상태
  shipping_address: string // 배송 주소
}
샵 (Shops) (신규)
javascript{
  id: string,              // 샵 고유 ID
  name: string,            // 샵 이름
  description: string,     // 샵 설명
  owner_id: string,        // 샵 오너 ID
  contact: string,         // 연락처
  address: string,         // 샵 주소 (선택)
  is_active: boolean,      // 샵 활성화 여부
  created_at: timestamp,   // 생성 시간
  updated_at: timestamp    // 수정 시간
}
샵 오너 (Shop Owners) (신규)
javascript{
  id: string,              // 오너 고유 ID
  shop_id: string,         // 소속 샵 ID
  username: string,        // 사용자 이름
  email: string,           // 이메일
  role: string,            // 역할 (예: shop_owner)
  permissions: array       // 권한 목록 (예: ["product_create", "product_update"])
}
🔗 주요 기능 URI (업데이트)
사용자 인터페이스

/ - 메인 페이지
/shops - 샵 리스트 페이지 (신규)
/shops/:id - 특정 샵 상세 페이지 (신규)
/admin.html - 관리자 대시보드
/shop-owner.html - 샵 오너 대시보드 (신규)
#products - 상품 목록 섹션
#categories - 카테고리 섹션
#about - 소개 섹션

API 엔드포인트

GET /tables/products - 상품 목록 조회
POST /tables/products - 상품 생성
GET /tables/categories - 카테고리 목록
GET /tables/orders - 주문 목록
POST /tables/orders - 주문 생성
GET /tables/social_posts - 소셜 포스트 목록
GET /tables/shops - 샵 목록 조회 (신규)
POST /tables/shops - 샵 생성 (신규)
PUT /tables/shops/:id - 샵 수정 (신규)
DELETE /tables/shops/:id - 샵 삭제 (신규)
GET /tables/shop_owners - 샵 오너 목록 조회 (신규)
POST /tables/shop_owners - 샵 오너 생성 (신규)

📊 대시보드 기능 (업데이트)
통계 및 분석

실시간 매출: 일간/월간 매출 현황
샵별 매출 (신규): 샵별 매출 통계
상품 통계: 총 상품 수, 카테고리별 분포
주문 현황: 신규 주문, 처리 상태별 분류
소셜미디어: 예약된 포스트, 게시 현황

관리 기능

상품 관리: 추가, 수정, 삭제, 재고 관리
주문 처리: 주문 상태 변경, 배송 정보 업데이트
고객 관리: 고객 정보 조회, 주문 이력
미디어 관리: 이미지/동영상 업로드, 정리
샵 관리 (신규): 샵 추가, 수정, 삭제, 오너 관리
샵 오너 관리 (신규): 오너 계정 생성, 권한 부여

🤖 소셜미디어 자동화 (업데이트)

플랫폼 연동: 페이스북, 인스타그램, 트위터(X)
자동 포스팅: 상품 기반 자동 컨텐츠 생성
예약 시스템: 날짜/시간 예약 포스팅
해시태그: 자동 해시태그 생성 및 관리
샵별 포스팅 (신규): 각 샵의 상품 및 정보를 기반으로 한 맞춤 포스팅

🌟 향후 개발 계획
단기 계획 (1-2개월)

 결제 시스템 연동: PayPal, Stripe 연동
 배송 추적 시스템: 실시간 배송 상태 조회
 재고 알림: 재고 부족시 자동 알림
 고객 리뷰: 상품 리뷰 및 평점 시스템
 샵 리뷰 시스템: 샵별 고객 리뷰 및 평점 (신규)

중기 계획 (3-6개월)

 멤버십 시스템: 회원 등급별 혜택
 위시리스트: 관심 상품 저장 기능
 쿠폰 시스템: 할인 쿠폰 발행 및 관리
 이메일 마케팅: 자동 이메일 발송
 샵별 프로모션: 샵별 할인 및 이벤트 관리 (신규)

장기 계획 (6개월+)

 모바일 앱: React Native 기반 앱 개발
 AI 추천 시스템: 개인화된 상품 추천
 AR/VR 체험: 가상 식물 배치 체험
 글로벌 확장: 다국가 배송 시스템
 샵 커뮤니티: 샵 오너와 고객 간 소통 기능 (신규)

🛡 보안 및 성능 (변경 없음)
보안 조치

데이터 검증: 클라이언트/서버 사이드 검증
XSS 방지: 사용자 입력 데이터 이스케이프
CSRF 방지: 토큰 기반 요청 검증
HTTPS: SSL/TLS 암호화 통신

성능 최적화

이미지 최적화: WebP 형식, 압축
캐싱: 브라우저 캐싱, CDN 활용
지연 로딩: 이미지 lazy loading
코드 분할: JavaScript 번들 최적화

📱 모바일 지원 (변경 없음)
반응형 디자인

Breakpoints: 모바일(~768px), 태블릿(768px~1024px), 데스크톱(1024px+)
Touch UI: 모바일 터치 인터페이스 최적화
성능: 모바일 네트워크 환경 고려

🧪 테스트 (업데이트)
브라우저 호환성

Chrome: 최신 버전 완전 지원
Firefox: 최신 버전 완전 지원
Safari: iOS/macOS 완전 지원
Edge: 최신 버전 완전 지원

기능 테스트

상품 관리: CRUD 동작 확인
주문 프로세스: 전체 주문 플로우 테스트
결제 시뮬레이션: 가상 결제 테스트
반응형: 다양한 화면 크기 테스트
샵 관리 (신규): 샵 CRUD, 오너 권한 테스트
샵리스트 메뉴 (신규): 사용자 화면에서의 샵 조회 및 필터링 테스트
샵 오너 기능 (신규): 상품 등록/관리, 매출 통계 확인 테스트

📞 연락처 및 지원 (변경 없음)
개발팀

프로젝트 관리자: Thai Exotic Plants Team
기술 지원: admin@thaiplants.com
고객 서비스: support@thaiplants.com

소셜미디어

Facebook: @ThaiExoticPlants
Instagram: @thai_exotic_plants
Twitter: @ThaiPlants

📄 라이센스
이 프로젝트는 MIT 라이센스 하에 배포됩니다. 자세한 내용은 LICENSE 파일을 참조하세요.
🙏 기여 및 감사 (변경 없음)
기여자

디자인: Tailwind CSS 커뮤니티
아이콘: Font Awesome
이미지: Unsplash 제공 식물 사진

특별한 감사

태국 현지 식물 공급업체
한국 식물 애호가 커뮤니티
개발 과정에서 도움을 주신 모든 분들


🚀 시작하기 (업데이트)
1. 프로젝트 복제
bashgit clone https://github.com/your-username/thai-exotic-plants.git
cd thai-exotic-plants
2. 로컬 서버 실행
bash# Python 사용시
python -m http.server 8000

# Node.js 사용시
npx serve .

# 또는 Live Server 확장 프로그램 사용
3. 브라우저에서 접속
texthttp://localhost:8000
4. 관리자 페이지 접속
texthttp://localhost:8000/admin.html
5. 샵 오너 페이지 접속 (신규)
texthttp://localhost:8000/shop-owner.html
이제 Thai Exotic Plants 쇼핑몰을 사용할 준비가 완료되었습니다! 🌱
배포를 위해서는 Publish 탭을 이용해 주세요.