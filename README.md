# Thai Exotic Plants - 태국 특이식물 전문 쇼핑몰

> 태국에서 직접 수집한 희귀하고 아름다운 특이식물을 한국으로 직배송하는 전문 온라인 쇼핑몰

## 🌱 프로젝트 개요

Thai Exotic Plants는 태국 현지에서 희귀한 특이식물을 수집하여 한국의 식물 애호가들에게 제공하는 전문 쇼핑몰입니다. 워드프레스 기반의 쇼핑 기능과 소셜미디어 자동화 시스템을 갖춘 종합적인 전자상거래 플랫폼입니다.

### 주요 특징

- 🛒 **종합 쇼핑몰**: 상품 등록부터 주문 처리까지 완전한 전자상거래 시스템
- 📱 **반응형 디자인**: 모바일, 태블릿, 데스크톱 모든 기기에서 최적화된 사용자 경험
- 🤖 **소셜미디어 자동화**: 페이스북, 인스타그램, 트위터(X)에 자동 포스팅
- 📊 **관리자 대시보드**: 실시간 매출 분석 및 상품/주문 관리
- 🎥 **미디어 관리**: 이미지와 동영상 업로드 및 관리 시스템
- 🌏 **다국어 지원**: 한국어, 영어, 태국어 상품명 및 설명

## 🚀 현재 구현된 기능

### ✅ 완료된 기능

#### 1. 데이터베이스 시스템
- **상품 관리**: 이름, 가격, 재고, 이미지, 동영상, 카테고리 관리
- **카테고리 시스템**: 계층형 카테고리 구조 (희귀 아로이드, 다육식물, 관엽식물, 꽃식물)
- **주문 관리**: 고객 정보, 결제 상태, 배송 추적
- **소셜미디어**: 포스트 예약 및 자동 게시 관리

#### 2. 사용자 인터페이스
- **메인 페이지**: 히어로 섹션, 특징 소개, 상품 진열
- **상품 목록**: 필터링, 정렬, 검색 기능
- **상품 상세**: 이미지 갤러리, 동영상, 상세 정보
- **장바구니**: 실시간 장바구니, 수량 조절
- **주문하기**: 고객 정보 입력, 결제 정보

#### 3. 관리자 시스템
- **대시보드**: 매출 통계, 차트 분석
- **상품 관리**: CRUD 기능, 대량 업로드
- **주문 관리**: 주문 상태 변경, 배송 추적
- **카테고리 관리**: 카테고리 생성, 수정, 삭제

#### 4. 소셜미디어 자동화
- **플랫폼 연동**: 페이스북, 인스타그램, 트위터(X)
- **자동 포스팅**: 상품 기반 자동 컨텐츠 생성
- **예약 시스템**: 날짜/시간 예약 포스팅
- **해시태그**: 자동 해시태그 생성 및 관리

#### 5. 미디어 관리
- **파일 업로드**: 드래그 앤 드롭, 다중 파일 업로드
- **미디어 라이브러리**: 이미지/동영상 관리
- **썸네일 생성**: 자동 썸네일 및 미리보기
- **메타데이터**: 파일명, 설명, 태그 관리

## 📂 프로젝트 구조

```
Thai-Exotic-Plants/
├── index.html              # 메인 페이지
├── admin.html              # 관리자 대시보드
├── css/
│   └── style.css          # 커스텀 스타일
├── js/
│   ├── main.js            # 메인 애플리케이션 로직
│   ├── cart.js            # 장바구니 및 주문 시스템
│   ├── products.js        # 상품 관리 로직
│   ├── admin.js           # 관리자 기능
│   ├── social-media.js    # 소셜미디어 자동화
│   └── media-manager.js   # 미디어 관리 시스템
└── README.md              # 프로젝트 문서
```

## 🛠 기술 스택

### Frontend
- **HTML5**: 시맨틱 마크업
- **Tailwind CSS**: 유틸리티 기반 CSS 프레임워크
- **Vanilla JavaScript**: ES6+ 문법 활용
- **Chart.js**: 데이터 시각화
- **Font Awesome**: 아이콘 라이브러리

### Backend (RESTful API)
- **RESTful Table API**: 데이터 관리
- **LocalStorage**: 클라이언트 사이드 저장
- **JSON**: 데이터 교환 형식

### 외부 서비스 연동
- **소셜미디어 API**: Facebook Graph API, Instagram Basic Display, Twitter API v2
- **결제 시스템**: 추후 연동 예정
- **배송 추적**: 추후 연동 예정

## 📋 데이터 모델

### 상품 (Products)
```javascript
{
  id: string,              // 고유 ID
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
```

### 주문 (Orders)
```javascript
{
  id: string,              // 주문 ID
  order_number: string,    // 주문번호
  customer_name: string,   // 고객명
  customer_email: string,  // 고객 이메일
  total_amount: number,    // 총 주문금액
  payment_status: string,  // 결제 상태
  order_status: string,    // 주문 상태
  shipping_address: string // 배송 주소
}
```

## 🔗 주요 기능 URI

### 사용자 인터페이스
- `/` - 메인 페이지
- `/admin.html` - 관리자 대시보드
- `#products` - 상품 목록 섹션
- `#categories` - 카테고리 섹션
- `#about` - 소개 섹션

### API 엔드포인트
- `GET /tables/products` - 상품 목록 조회
- `POST /tables/products` - 상품 생성
- `GET /tables/categories` - 카테고리 목록
- `GET /tables/orders` - 주문 목록
- `POST /tables/orders` - 주문 생성
- `GET /tables/social_posts` - 소셜 포스트 목록

## 📊 대시보드 기능

### 통계 및 분석
- **실시간 매출**: 일간/월간 매출 현황
- **상품 통계**: 총 상품 수, 카테고리별 분포
- **주문 현황**: 신규 주문, 처리 상태별 분류
- **소셜미디어**: 예약된 포스트, 게시 현황

### 관리 기능
- **상품 관리**: 추가, 수정, 삭제, 재고 관리
- **주문 처리**: 주문 상태 변경, 배송 정보 업데이트
- **고객 관리**: 고객 정보 조회, 주문 이력
- **미디어 관리**: 이미지/동영상 업로드, 정리

## 🤖 소셜미디어 자동화

### 지원 플랫폼
- **Facebook**: 페이지 포스팅, 이미지/동영상 업로드
- **Instagram**: 피드 포스팅, 스토리 (향후 지원)
- **Twitter (X)**: 트윗, 이미지 첨부

### 자동화 기능
- **상품 기반 포스팅**: 신상품 자동 홍보
- **예약 포스팅**: 날짜/시간 지정 게시
- **템플릿 시스템**: 다양한 포스트 템플릿
- **해시태그 자동 생성**: 상품 태그 기반 해시태그

## 🌟 향후 개발 계획

### 단기 계획 (1-2개월)
- [ ] **결제 시스템 연동**: PayPal, Stripe 연동
- [ ] **배송 추적 시스템**: 실시간 배송 상태 조회
- [ ] **재고 알림**: 재고 부족시 자동 알림
- [ ] **고객 리뷰**: 상품 리뷰 및 평점 시스템

### 중기 계획 (3-6개월)
- [ ] **멤버십 시스템**: 회원 등급별 혜택
- [ ] **위시리스트**: 관심 상품 저장 기능
- [ ] **쿠폰 시스템**: 할인 쿠폰 발행 및 관리
- [ ] **이메일 마케팅**: 자동 이메일 발송

### 장기 계획 (6개월+)
- [ ] **모바일 앱**: React Native 기반 앱 개발
- [ ] **AI 추천 시스템**: 개인화된 상품 추천
- [ ] **AR/VR 체험**: 가상 식물 배치 체험
- [ ] **글로벌 확장**: 다국가 배송 시스템

## 🛡 보안 및 성능

### 보안 조치
- **데이터 검증**: 클라이언트/서버 사이드 검증
- **XSS 방지**: 사용자 입력 데이터 이스케이프
- **CSRF 방지**: 토큰 기반 요청 검증
- **HTTPS**: SSL/TLS 암호화 통신

### 성능 최적화
- **이미지 최적화**: WebP 형식, 압축
- **캐싱**: 브라우저 캐싱, CDN 활용
- **지연 로딩**: 이미지 lazy loading
- **코드 분할**: JavaScript 번들 최적화

## 📱 모바일 지원

### 반응형 디자인
- **Breakpoints**: 모바일(~768px), 태블릿(768px~1024px), 데스크톱(1024px+)
- **Touch UI**: 모바일 터치 인터페이스 최적화
- **성능**: 모바일 네트워크 환경 고려

## 🧪 테스트

### 브라우저 호환성
- **Chrome**: 최신 버전 완전 지원
- **Firefox**: 최신 버전 완전 지원
- **Safari**: iOS/macOS 완전 지원
- **Edge**: 최신 버전 완전 지원

### 기능 테스트
- **상품 관리**: CRUD 동작 확인
- **주문 프로세스**: 전체 주문 플로우 테스트
- **결제 시뮬레이션**: 가상 결제 테스트
- **반응형**: 다양한 화면 크기 테스트

## 📞 연락처 및 지원

### 개발팀
- **프로젝트 관리자**: Thai Exotic Plants Team
- **기술 지원**: admin@thaiplants.com
- **고객 서비스**: support@thaiplants.com

### 소셜미디어
- **Facebook**: @ThaiExoticPlants
- **Instagram**: @thai_exotic_plants
- **Twitter**: @ThaiPlants

## 📄 라이센스

이 프로젝트는 MIT 라이센스 하에 배포됩니다. 자세한 내용은 LICENSE 파일을 참조하세요.

## 🙏 기여 및 감사

### 기여자
- 디자인: Tailwind CSS 커뮤니티
- 아이콘: Font Awesome
- 이미지: Unsplash 제공 식물 사진

### 특별한 감사
- 태국 현지 식물 공급업체
- 한국 식물 애호가 커뮤니티
- 개발 과정에서 도움을 주신 모든 분들

---

## 🚀 시작하기

### 1. 프로젝트 복제
```bash
git clone https://github.com/your-username/thai-exotic-plants.git
cd thai-exotic-plants
```

### 2. 로컬 서버 실행
```bash
# Python 사용시
python -m http.server 8000

# Node.js 사용시
npx serve .

# 또는 Live Server 확장 프로그램 사용
```

### 3. 브라우저에서 접속
```
http://localhost:8000
```

### 4. 관리자 페이지 접속
```
http://localhost:8000/admin.html
```

이제 Thai Exotic Plants 쇼핑몰을 사용할 준비가 완료되었습니다! 🌱

**배포를 위해서는 Publish 탭을 이용해 주세요.**