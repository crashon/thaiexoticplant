// Internationalization (i18n) System for Thai Exotic Plants
// 다국어 지원 시스템 (한국어, 영어, 태국어)

class I18nManager {
    constructor() {
        this.currentLanguage = this.getStoredLanguage() || 'ko';
        this.translations = {
            ko: this.getKoreanTranslations(),
            en: this.getEnglishTranslations(),
            th: this.getThaiTranslations()
        };
        this.init();
    }

    // 저장된 언어 설정 가져오기
    getStoredLanguage() {
        try {
            return localStorage.getItem('thaiPlantsLanguage') || 'ko';
        } catch (error) {
            console.error('언어 설정 로드 중 오류:', error);
            return 'ko';
        }
    }

    // 언어 설정 저장
    setStoredLanguage(language) {
        try {
            localStorage.setItem('thaiPlantsLanguage', language);
        } catch (error) {
            console.error('언어 설정 저장 중 오류:', error);
        }
    }

    // 초기화
    init() {
        this.updateDocumentLanguage();
        this.createLanguageSwitcher();
        this.translatePage();
    }

    // 문서 언어 속성 업데이트
    updateDocumentLanguage() {
        document.documentElement.lang = this.currentLanguage;
    }

    // 언어 변경
    changeLanguage(language) {
        if (!this.translations[language]) {
            console.error(`지원하지 않는 언어: ${language}`);
            return;
        }

        this.currentLanguage = language;
        this.setStoredLanguage(language);
        this.updateDocumentLanguage();
        this.translatePage();
        this.updateLanguageSwitcher();
        
        // 알림 표시
        if (window.showNotification) {
            const message = this.t('language.changed', { language: this.t(`languages.${language}`) });
            showNotification(message, 'success');
        }
    }

    // 번역 함수
    t(key, params = {}) {
        const keys = key.split('.');
        let translation = this.translations[this.currentLanguage];
        
        for (const k of keys) {
            if (translation && translation[k]) {
                translation = translation[k];
            } else {
                console.warn(`번역 키를 찾을 수 없습니다: ${key}`);
                return key;
            }
        }

        // 매개변수 치환
        if (typeof translation === 'string') {
            return translation.replace(/\{\{(\w+)\}\}/g, (match, param) => {
                return params[param] || match;
            });
        }

        return translation;
    }

    // 페이지 번역
    translatePage() {
        // data-i18n 속성이 있는 모든 요소 번역
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.t(key);
            
            if (element.tagName === 'INPUT' && element.type === 'text') {
                element.placeholder = translation;
            } else if (element.tagName === 'INPUT' && element.type === 'submit') {
                element.value = translation;
            } else {
                element.textContent = translation;
            }
        });

        // title 속성 번역
        document.querySelectorAll('[data-i18n-title]').forEach(element => {
            const key = element.getAttribute('data-i18n-title');
            element.title = this.t(key);
        });

        // alt 속성 번역
        document.querySelectorAll('[data-i18n-alt]').forEach(element => {
            const key = element.getAttribute('data-i18n-alt');
            element.alt = this.t(key);
        });
    }

    // 언어 선택기 생성
    createLanguageSwitcher() {
        // 기존 언어 선택기가 있다면 제거
        const existingSwitcher = document.getElementById('language-switcher');
        if (existingSwitcher) {
            existingSwitcher.remove();
        }

        const switcher = document.createElement('div');
        switcher.id = 'language-switcher';
        switcher.className = 'fixed top-4 right-4 z-50';
        switcher.innerHTML = `
            <div class="relative">
                <button id="language-btn" class="bg-white shadow-lg rounded-lg px-4 py-2 flex items-center space-x-2 hover:bg-gray-50 transition duration-200">
                    <i class="fas fa-globe text-gray-600"></i>
                    <span id="current-language">${this.t(`languages.${this.currentLanguage}`)}</span>
                    <i class="fas fa-chevron-down text-gray-400"></i>
                </button>
                <div id="language-dropdown" class="hidden absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200">
                    <div class="py-2">
                        <button onclick="i18n.changeLanguage('ko')" class="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center space-x-3">
                            <span class="text-lg">🇰🇷</span>
                            <span>한국어</span>
                        </button>
                        <button onclick="i18n.changeLanguage('en')" class="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center space-x-3">
                            <span class="text-lg">🇺🇸</span>
                            <span>English</span>
                        </button>
                        <button onclick="i18n.changeLanguage('th')" class="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center space-x-3">
                            <span class="text-lg">🇹🇭</span>
                            <span>ไทย</span>
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(switcher);

        // 드롭다운 토글
        document.getElementById('language-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            const dropdown = document.getElementById('language-dropdown');
            dropdown.classList.toggle('hidden');
        });

        // 외부 클릭 시 드롭다운 닫기
        document.addEventListener('click', (e) => {
            if (!switcher.contains(e.target)) {
                document.getElementById('language-dropdown').classList.add('hidden');
            }
        });
    }

    // 언어 선택기 업데이트
    updateLanguageSwitcher() {
        const currentLangSpan = document.getElementById('current-language');
        if (currentLangSpan) {
            currentLangSpan.textContent = this.t(`languages.${this.currentLanguage}`);
        }
    }

    // 한국어 번역
    getKoreanTranslations() {
        return {
            languages: {
                ko: '한국어',
                en: 'English',
                th: 'ไทย'
            },
            common: {
                loading: '로딩 중...',
                error: '오류가 발생했습니다',
                success: '성공적으로 완료되었습니다',
                confirm: '확인',
                cancel: '취소',
                save: '저장',
                edit: '편집',
                delete: '삭제',
                add: '추가',
                search: '검색',
                filter: '필터',
                export: '내보내기',
                import: '가져오기',
                close: '닫기',
                yes: '예',
                no: '아니오'
            },
            navigation: {
                dashboard: '대시보드',
                products: '상품 관리',
                categories: '카테고리 관리',
                orders: '주문 관리',
                social: '소셜미디어',
                media: '미디어 관리',
                analytics: '소셜미디어 분석'
            },
            dashboard: {
                title: '관리자 대시보드',
                subtitle: '태국 희귀식물 쇼핑몰 관리',
                stats: {
                    totalProducts: '총 상품',
                    totalOrders: '총 주문',
                    totalRevenue: '총 매출',
                    totalCustomers: '총 고객'
                }
            },
            products: {
                title: '상품 관리',
                subtitle: '상품을 추가, 편집, 삭제하세요',
                addProduct: '상품 추가',
                editProduct: '상품 편집',
                deleteProduct: '상품 삭제',
                productName: '상품명',
                productDescription: '상품 설명',
                price: '가격',
                stock: '재고',
                category: '카테고리',
                status: '상태',
                active: '활성',
                inactive: '비활성',
                featured: '추천 상품',
                rare: '희귀종',
                searchPlaceholder: '상품명으로 검색...',
                categoryFilter: '전체 카테고리',
                statusFilter: '전체 상태'
            },
            categories: {
                title: '카테고리 관리',
                subtitle: '상품 카테고리를 관리하고 정리할 수 있습니다',
                addCategory: '카테고리 추가',
                editCategory: '카테고리 편집',
                deleteCategory: '카테고리 삭제',
                categoryName: '카테고리명',
                categoryDescription: '카테고리 설명',
                productCount: '상품 수'
            },
            orders: {
                title: '주문 관리',
                subtitle: '고객 주문을 관리하세요',
                orderId: '주문번호',
                customer: '고객',
                total: '총액',
                status: '상태',
                paymentStatus: '결제상태',
                date: '주문일',
                pending: '대기중',
                processing: '처리중',
                shipped: '배송중',
                delivered: '배송완료',
                cancelled: '취소됨',
                paid: '결제완료',
                unpaid: '미결제',
                viewOrder: '주문 보기',
                editOrder: '주문 편집'
            },
            social: {
                title: '소셜미디어 관리',
                subtitle: '소셜미디어 포스트를 관리하세요',
                addPost: '포스트 추가',
                editPost: '포스트 편집',
                deletePost: '포스트 삭제',
                postTitle: '포스트 제목',
                postContent: '포스트 내용',
                platforms: '플랫폼',
                hashtags: '해시태그',
                scheduledTime: '예약 시간',
                status: '상태',
                scheduled: '예약',
                published: '게시완료',
                failed: '실패',
                automation: {
                    title: '자동화 설정',
                    start: '시작',
                    stop: '중지',
                    running: '실행 중',
                    stopped: '중지됨',
                    totalPosts: '총 포스트',
                    scheduledPosts: '예약된 포스트',
                    publishedPosts: '게시 완료',
                    createProductPost: '상품 포스트 생성',
                    createCareTip: '관리 팁 생성',
                    createSeasonalPost: '계절별 포스트 생성',
                    refreshStats: '통계 새로고침'
                }
            },
            media: {
                title: '미디어 관리',
                subtitle: '이미지와 동영상을 관리하세요',
                upload: '미디어 업로드',
                uploadPlaceholder: '파일을 업로드하세요',
                uploadDescription: '이미지나 동영상을 드래그하여 놓거나 클릭하여 선택하세요',
                selectFiles: '파일 선택',
                mediaLibrary: '미디어 라이브러리',
                fileName: '파일명',
                fileSize: '파일 크기',
                uploadDate: '업로드일',
                view: '보기',
                copyUrl: 'URL 복사',
                delete: '삭제'
            },
            analytics: {
                title: '소셜미디어 분석',
                subtitle: '소셜미디어 성과를 분석하고 인사이트를 확인하세요',
                totalPosts: '총 포스트',
                totalLikes: '총 좋아요',
                totalComments: '총 댓글',
                totalShares: '총 공유',
                platformPerformance: '플랫폼별 성과',
                hourlyPosts: '시간대별 게시',
                popularHashtags: '인기 해시태그',
                bestPosts: '최고 성과 포스트',
                engagement: '참여도'
            },
            language: {
                changed: '언어가 {{language}}로 변경되었습니다.'
            },
            hero: {
                title: 'Thai Exotic Plants - 태국 특이식물 전문 쇼핑몰',
                brand: 'Thai Exotic Plants',
                subtitle: '태국 특이식물 전문 쇼핑몰',
                description: '태국에서 직접 수집한 희귀하고 아름다운 식물들을 만나보세요',
                cta: '지금 둘러보기'
            },
            nav: {
                home: '홈',
                products: '상품보기',
                categories: '카테고리',
                about: '소개',
                admin: '관리자'
            },
            cart: {
                title: '장바구니',
                empty: '장바구니가 비어있습니다',
                total: '총합',
                checkout: '결제하기',
                addToCart: '장바구니에 추가',
                removeFromCart: '제거'
            },
            product: {
                price: '가격',
                stock: '재고',
                addToCart: '장바구니에 추가',
                outOfStock: '품절',
                inStock: '재고 있음'
            },
            footer: {
                about: '회사 소개',
                contact: '연락처',
                privacy: '개인정보처리방침',
                terms: '이용약관',
                copyright: '© 2024 Thai Exotic Plants. All rights reserved.'
            }
        };
    }

    // 영어 번역
    getEnglishTranslations() {
        return {
            languages: {
                ko: '한국어',
                en: 'English',
                th: 'ไทย'
            },
            common: {
                loading: 'Loading...',
                error: 'An error occurred',
                success: 'Successfully completed',
                confirm: 'Confirm',
                cancel: 'Cancel',
                save: 'Save',
                edit: 'Edit',
                delete: 'Delete',
                add: 'Add',
                search: 'Search',
                filter: 'Filter',
                export: 'Export',
                import: 'Import',
                close: 'Close',
                yes: 'Yes',
                no: 'No'
            },
            navigation: {
                dashboard: 'Dashboard',
                products: 'Products',
                categories: 'Categories',
                orders: 'Orders',
                social: 'Social Media',
                media: 'Media',
                analytics: 'Analytics'
            },
            dashboard: {
                title: 'Admin Dashboard',
                subtitle: 'Thai Exotic Plants Store Management',
                stats: {
                    totalProducts: 'Total Products',
                    totalOrders: 'Total Orders',
                    totalRevenue: 'Total Revenue',
                    totalCustomers: 'Total Customers'
                }
            },
            products: {
                title: 'Product Management',
                subtitle: 'Add, edit, and delete products',
                addProduct: 'Add Product',
                editProduct: 'Edit Product',
                deleteProduct: 'Delete Product',
                productName: 'Product Name',
                productDescription: 'Product Description',
                price: 'Price',
                stock: 'Stock',
                category: 'Category',
                status: 'Status',
                active: 'Active',
                inactive: 'Inactive',
                featured: 'Featured',
                rare: 'Rare',
                searchPlaceholder: 'Search by product name...',
                categoryFilter: 'All Categories',
                statusFilter: 'All Status'
            },
            categories: {
                title: 'Category Management',
                subtitle: 'Manage and organize product categories',
                addCategory: 'Add Category',
                editCategory: 'Edit Category',
                deleteCategory: 'Delete Category',
                categoryName: 'Category Name',
                categoryDescription: 'Category Description',
                productCount: 'Product Count'
            },
            orders: {
                title: 'Order Management',
                subtitle: 'View and manage customer orders',
                orderId: 'Order ID',
                customer: 'Customer',
                total: 'Total',
                status: 'Status',
                paymentStatus: 'Payment Status',
                date: 'Date',
                pending: 'Pending',
                processing: 'Processing',
                shipped: 'Shipped',
                delivered: 'Delivered',
                cancelled: 'Cancelled',
                paid: 'Paid',
                unpaid: 'Unpaid',
                viewOrder: 'View Order',
                editOrder: 'Edit Order'
            },
            social: {
                title: 'Social Media Management',
                subtitle: 'Manage Facebook, Instagram, Twitter auto-posting',
                addPost: 'Add Post',
                editPost: 'Edit Post',
                deletePost: 'Delete Post',
                postTitle: 'Post Title',
                postContent: 'Post Content',
                platforms: 'Platforms',
                hashtags: 'Hashtags',
                scheduledTime: 'Scheduled Time',
                status: 'Status',
                scheduled: 'Scheduled',
                published: 'Published',
                failed: 'Failed',
                automation: {
                    title: 'Automation Settings',
                    start: 'Start',
                    stop: 'Stop',
                    running: 'Running',
                    stopped: 'Stopped',
                    totalPosts: 'Total Posts',
                    scheduledPosts: 'Scheduled Posts',
                    publishedPosts: 'Published Posts',
                    createProductPost: 'Create Product Post',
                    createCareTip: 'Create Care Tip',
                    createSeasonalPost: 'Create Seasonal Post',
                    refreshStats: 'Refresh Stats'
                }
            },
            media: {
                title: 'Media Management',
                subtitle: 'Upload and manage images and videos',
                upload: 'Upload Media',
                uploadPlaceholder: 'Upload files',
                uploadDescription: 'Drag and drop images or videos, or click to select',
                selectFiles: 'Select Files',
                mediaLibrary: 'Media Library',
                fileName: 'File Name',
                fileSize: 'File Size',
                uploadDate: 'Upload Date',
                view: 'View',
                copyUrl: 'Copy URL',
                delete: 'Delete'
            },
            analytics: {
                title: 'Social Media Analytics',
                subtitle: 'Analyze social media performance and insights',
                totalPosts: 'Total Posts',
                totalLikes: 'Total Likes',
                totalComments: 'Total Comments',
                totalShares: 'Total Shares',
                platformPerformance: 'Platform Performance',
                hourlyPosts: 'Hourly Posts',
                popularHashtags: 'Popular Hashtags',
                bestPosts: 'Best Performing Posts',
                engagement: 'Engagement'
            },
            language: {
                changed: 'Language changed to {{language}}.'
            },
            hero: {
                title: 'Thai Exotic Plants - Premium Thai Exotic Plants Store',
                brand: 'Thai Exotic Plants',
                subtitle: 'Premium Thai Exotic Plants Store',
                description: 'Discover rare and beautiful plants collected directly from Thailand',
                cta: 'Explore Now'
            },
            nav: {
                home: 'Home',
                products: 'Products',
                categories: 'Categories',
                about: 'About',
                admin: 'Admin'
            },
            cart: {
                title: 'Shopping Cart',
                empty: 'Your cart is empty',
                total: 'Total',
                checkout: 'Checkout',
                addToCart: 'Add to Cart',
                removeFromCart: 'Remove'
            },
            product: {
                price: 'Price',
                stock: 'Stock',
                addToCart: 'Add to Cart',
                outOfStock: 'Out of Stock',
                inStock: 'In Stock'
            },
            footer: {
                about: 'About Us',
                contact: 'Contact',
                privacy: 'Privacy Policy',
                terms: 'Terms of Service',
                copyright: '© 2024 Thai Exotic Plants. All rights reserved.'
            }
        };
    }

    // 태국어 번역
    getThaiTranslations() {
        return {
            languages: {
                ko: '한국어',
                en: 'English',
                th: 'ไทย'
            },
            common: {
                loading: 'กำลังโหลด...',
                error: 'เกิดข้อผิดพลาด',
                success: 'สำเร็จแล้ว',
                confirm: 'ยืนยัน',
                cancel: 'ยกเลิก',
                save: 'บันทึก',
                edit: 'แก้ไข',
                delete: 'ลบ',
                add: 'เพิ่ม',
                search: 'ค้นหา',
                filter: 'กรอง',
                export: 'ส่งออก',
                import: 'นำเข้า',
                close: 'ปิด',
                yes: 'ใช่',
                no: 'ไม่'
            },
            navigation: {
                dashboard: 'แดชบอร์ด',
                products: 'จัดการสินค้า',
                categories: 'จัดการหมวดหมู่',
                orders: 'จัดการคำสั่งซื้อ',
                social: 'โซเชียลมีเดีย',
                media: 'จัดการสื่อ',
                analytics: 'วิเคราะห์โซเชียลมีเดีย'
            },
            dashboard: {
                title: 'แดชบอร์ดผู้ดูแล',
                subtitle: 'การจัดการร้านขายพืชหายากจากไทย',
                stats: {
                    totalProducts: 'สินค้าทั้งหมด',
                    totalOrders: 'คำสั่งซื้อทั้งหมด',
                    totalRevenue: 'รายได้ทั้งหมด',
                    totalCustomers: 'ลูกค้าทั้งหมด'
                }
            },
            products: {
                title: 'จัดการสินค้า',
                subtitle: 'เพิ่ม แก้ไข และลบสินค้า',
                addProduct: 'เพิ่มสินค้า',
                editProduct: 'แก้ไขสินค้า',
                deleteProduct: 'ลบสินค้า',
                productName: 'ชื่อสินค้า',
                productDescription: 'คำอธิบายสินค้า',
                price: 'ราคา',
                stock: 'สต็อก',
                category: 'หมวดหมู่',
                status: 'สถานะ',
                active: 'ใช้งาน',
                inactive: 'ไม่ใช้งาน',
                featured: 'สินค้าแนะนำ',
                rare: 'หายาก',
                searchPlaceholder: 'ค้นหาตามชื่อสินค้า...',
                categoryFilter: 'หมวดหมู่ทั้งหมด',
                statusFilter: 'สถานะทั้งหมด'
            },
            categories: {
                title: 'จัดการหมวดหมู่',
                subtitle: 'จัดการและจัดระเบียบหมวดหมู่สินค้า',
                addCategory: 'เพิ่มหมวดหมู่',
                editCategory: 'แก้ไขหมวดหมู่',
                deleteCategory: 'ลบหมวดหมู่',
                categoryName: 'ชื่อหมวดหมู่',
                categoryDescription: 'คำอธิบายหมวดหมู่',
                productCount: 'จำนวนสินค้า'
            },
            orders: {
                title: 'จัดการคำสั่งซื้อ',
                subtitle: 'ดูและจัดการคำสั่งซื้อของลูกค้า',
                orderId: 'หมายเลขคำสั่งซื้อ',
                customer: 'ลูกค้า',
                total: 'ยอดรวม',
                status: 'สถานะ',
                paymentStatus: 'สถานะการชำระเงิน',
                date: 'วันที่',
                pending: 'รอดำเนินการ',
                processing: 'กำลังดำเนินการ',
                shipped: 'จัดส่งแล้ว',
                delivered: 'ส่งมอบแล้ว',
                cancelled: 'ยกเลิกแล้ว',
                paid: 'ชำระเงินแล้ว',
                unpaid: 'ยังไม่ชำระเงิน',
                viewOrder: 'ดูคำสั่งซื้อ',
                editOrder: 'แก้ไขคำสั่งซื้อ'
            },
            social: {
                title: 'จัดการโซเชียลมีเดีย',
                subtitle: 'จัดการการโพสต์อัตโนมัติ Facebook, Instagram, Twitter',
                addPost: 'เพิ่มโพสต์',
                editPost: 'แก้ไขโพสต์',
                deletePost: 'ลบโพสต์',
                postTitle: 'หัวข้อโพสต์',
                postContent: 'เนื้อหาโพสต์',
                platforms: 'แพลตฟอร์ม',
                hashtags: 'แฮชแท็ก',
                scheduledTime: 'เวลาที่กำหนด',
                status: 'สถานะ',
                scheduled: 'กำหนดแล้ว',
                published: 'เผยแพร่แล้ว',
                failed: 'ล้มเหลว',
                automation: {
                    title: 'การตั้งค่าอัตโนมัติ',
                    start: 'เริ่มต้น',
                    stop: 'หยุด',
                    running: 'กำลังทำงาน',
                    stopped: 'หยุดแล้ว',
                    totalPosts: 'โพสต์ทั้งหมด',
                    scheduledPosts: 'โพสต์ที่กำหนด',
                    publishedPosts: 'โพสต์ที่เผยแพร่',
                    createProductPost: 'สร้างโพสต์สินค้า',
                    createCareTip: 'สร้างเคล็ดลับการดูแล',
                    createSeasonalPost: 'สร้างโพสต์ตามฤดูกาล',
                    refreshStats: 'รีเฟรชสถิติ'
                }
            },
            media: {
                title: 'จัดการสื่อ',
                subtitle: 'อัปโหลดและจัดการรูปภาพและวิดีโอ',
                upload: 'อัปโหลดสื่อ',
                uploadPlaceholder: 'อัปโหลดไฟล์',
                uploadDescription: 'ลากและวางรูปภาพหรือวิดีโอ หรือคลิกเพื่อเลือก',
                selectFiles: 'เลือกไฟล์',
                mediaLibrary: 'ไลบรารีสื่อ',
                fileName: 'ชื่อไฟล์',
                fileSize: 'ขนาดไฟล์',
                uploadDate: 'วันที่อัปโหลด',
                view: 'ดู',
                copyUrl: 'คัดลอก URL',
                delete: 'ลบ'
            },
            analytics: {
                title: 'วิเคราะห์โซเชียลมีเดีย',
                subtitle: 'วิเคราะห์ผลงานโซเชียลมีเดียและข้อมูลเชิงลึก',
                totalPosts: 'โพสต์ทั้งหมด',
                totalLikes: 'ไลก์ทั้งหมด',
                totalComments: 'ความคิดเห็นทั้งหมด',
                totalShares: 'แชร์ทั้งหมด',
                platformPerformance: 'ผลงานตามแพลตฟอร์ม',
                hourlyPosts: 'โพสต์ตามชั่วโมง',
                popularHashtags: 'แฮชแท็กยอดนิยม',
                bestPosts: 'โพสต์ที่ทำผลงานดีที่สุด',
                engagement: 'การมีส่วนร่วม'
            },
            language: {
                changed: 'เปลี่ยนภาษาเป็น {{language}} แล้ว'
            },
            hero: {
                title: 'Thai Exotic Plants - ร้านขายพืชหายากจากไทย',
                brand: 'Thai Exotic Plants',
                subtitle: 'ร้านขายพืชหายากจากไทย',
                description: 'พบกับพืชหายากและสวยงามที่รวบรวมมาจากประเทศไทยโดยตรง',
                cta: 'สำรวจเลย'
            },
            nav: {
                home: 'หน้าแรก',
                products: 'สินค้า',
                categories: 'หมวดหมู่',
                about: 'เกี่ยวกับเรา',
                admin: 'ผู้ดูแล'
            },
            cart: {
                title: 'ตะกร้าสินค้า',
                empty: 'ตะกร้าสินค้าว่างเปล่า',
                total: 'รวม',
                checkout: 'ชำระเงิน',
                addToCart: 'เพิ่มในตะกร้า',
                removeFromCart: 'ลบออก'
            },
            product: {
                price: 'ราคา',
                stock: 'สต็อก',
                addToCart: 'เพิ่มในตะกร้า',
                outOfStock: 'สินค้าหมด',
                inStock: 'มีสินค้า'
            },
            footer: {
                about: 'เกี่ยวกับเรา',
                contact: 'ติดต่อ',
                privacy: 'นโยบายความเป็นส่วนตัว',
                terms: 'เงื่อนไขการใช้งาน',
                copyright: '© 2024 Thai Exotic Plants. สงวนลิขสิทธิ์ทั้งหมด'
            }
        };
    }
}

// 전역 인스턴스 생성
window.i18n = new I18nManager();

// 편의 함수들
function t(key, params = {}) {
    return window.i18n.t(key, params);
}

function changeLanguage(language) {
    window.i18n.changeLanguage(language);
}

// 페이지 로드 시 번역 적용
document.addEventListener('DOMContentLoaded', function() {
    // 약간의 지연을 두고 번역 적용 (다른 스크립트들이 로드된 후)
    setTimeout(() => {
        if (window.i18n) {
            window.i18n.translatePage();
        }
    }, 100);
});
