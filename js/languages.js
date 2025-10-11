// Language configuration for Thai Exotic Plants
const translations = {
    en: {
        // Navigation
        nav: {
            home: "Home",
            products: "Products",
            categories: "Categories",
            about: "About Us",
            admin: "Admin"
        },
        // Hero Section
        hero: {
            title: "Discover Rare Thai Plants",
            subtitle: "Exotic plants directly from Thailand to your home",
            cta: "Shop Now"
        },
        // Products Section
        products: {
            title: "Featured Plants",
            loadMore: "Load More",
            addToCart: "Add to Cart",
            viewDetails: "View Details",
            price: "Price",
            inStock: "In Stock",
            outOfStock: "Out of Stock"
        },
        // Categories
        categories: {
            title: "Shop by Category",
            all: "All Products"
        },
        // About Section
        about: {
            title: "About Thai Exotic Plants",
            content: "We specialize in bringing the most unique and exotic plants from Thailand to plant enthusiasts around the world. Our plants are carefully selected and shipped with the utmost care to ensure they arrive in perfect condition.",
            feature1: "Direct from Thailand",
            feature2: "Healthy Plants",
            feature3: "Secure Shipping"
        },
        // Footer
        footer: {
            aboutUs: "About Us",
            customerService: "Customer Service",
            contact: "Contact",
            followUs: "Follow Us",
            copyright: "© 2023 Thai Exotic Plants. All rights reserved.",
            newsletter: "Subscribe to our newsletter"
        }
    },
    ko: {
        // Navigation
        nav: {
            home: "홈",
            products: "상품보기",
            categories: "카테고리",
            about: "소개",
            admin: "관리자"
        },
        // Hero Section
        hero: {
            title: "희귀 태국 식물의 세계",
            subtitle: "태국에서 직접 배송하는 특이한 식물들",
            cta: "쇼핑하기"
        },
        // Products Section
        products: {
            title: "추천 상품",
            loadMore: "더보기",
            addToCart: "장바구니 담기",
            viewDetails: "상세보기",
            price: "가격",
            inStock: "재고 있음",
            outOfStock: "품절"
        },
        // Categories
        categories: {
            title: "카테고리별 보기",
            all: "전체 상품"
        },
        // About Section
        about: {
            title: "태국 특이식물 소개",
            content: "우리는 태국의 가장 독특하고 이국적인 식물들을 전 세계 식물 애호가들에게 제공하는 데 특화되어 있습니다. 모든 식물은 신중하게 선별되어 완벽한 상태로 배송될 수 있도록 최선을 다하고 있습니다.",
            feature1: "태국 직수입",
            feature2: "건강한 식물",
            feature3: "안전한 배송"
        },
        // Footer
        footer: {
            aboutUs: "회사소개",
            customerService: "고객센터",
            contact: "연락처",
            followUs: "소셜 미디어",
            copyright: "© 2023 태국 특이식물. 모든 권리 보유.",
            newsletter: "뉴스레터 구독하기"
        }
    },
    th: {
        // Navigation
        nav: {
            home: "หน้าหลัก",
            products: "สินค้า",
            categories: "หมวดหมู่",
            about: "เกี่ยวกับเรา",
            admin: "ผู้ดูแล"
        },
        // Hero Section
        hero: {
            title: "ค้นพบพืชหายากจากไทย",
            subtitle: "พืชแปลกใหม่จากประเทศไทย ส่งตรงถึงบ้านคุณ",
            cta: "ช้อปเลย"
        },
        // Products Section
        products: {
            title: "สินค้าแนะนำ",
            loadMore: "โหลดเพิ่มเติม",
            addToCart: "เพิ่มลงตะกร้า",
            viewDetails: "ดูรายละเอียด",
            price: "ราคา",
            inStock: "มีสินค้า",
            outOfStock: "สินค้าหมด"
        },
        // Categories
        categories: {
            title: "หมวดหมู่สินค้า",
            all: "สินค้าทั้งหมด"
        },
        // About Section
        about: {
            title: "เกี่ยวกับเรา",
            content: "เราคือผู้เชี่ยวชาญในการนำเข้าพืชหายากและแปลกใหม่จากประเทศไทยไปยังผู้รักพืชทั่วโลก พืชของเราถูกคัดสรรอย่างพิถีพิถันและจัดส่งด้วยความระมัดระวังเพื่อให้ถึงมือคุณในสภาพสมบูรณ์ที่สุด",
            feature1: "นำเข้าจากไทยโดยตรง",
            feature2: "พืชสุขภาพดี",
            feature3: "การจัดส่งที่ปลอดภัย"
        },
        // Footer
        footer: {
            aboutUs: "เกี่ยวกับเรา",
            customerService: "บริการลูกค้า",
            contact: "ติดต่อเรา",
            followUs: "ติดตามเรา",
            copyright: "© 2023 ไทยเอ็กโซติกแพลนท์ สงวนลิขสิทธิ์",
            newsletter: "สมัครรับจดหมายข่าว"
        }
    }
};

// Language switcher functionality
class LanguageManager {
    constructor() {
        this.currentLanguage = localStorage.getItem('thaiPlantsLanguage') || 'ko';
        this.initializeLanguageSwitcher();
        this.applyLanguage(this.currentLanguage);
    }

    initializeLanguageSwitcher() {
        const languageSwitcher = document.createElement('div');
        languageSwitcher.className = 'language-switcher flex items-center space-x-2';
        languageSwitcher.innerHTML = `
            <button data-lang="ko" class="text-sm px-2 py-1 rounded ${this.currentLanguage === 'ko' ? 'bg-thai-green text-white' : 'bg-gray-200'}">한국어</button>
            <button data-lang="en" class="text-sm px-2 py-1 rounded ${this.currentLanguage === 'en' ? 'bg-thai-green text-white' : 'bg-gray-200'}">English</button>
            <button data-lang="th" class="text-sm px-2 py-1 rounded ${this.currentLanguage === 'th' ? 'bg-thai-green text-white' : 'bg-gray-200'}">ไทย</button>
        `;
        
        // Add to header
        const header = document.querySelector('header .container');
        if (header) {
            const nav = header.querySelector('nav');
            if (nav) {
                nav.appendChild(languageSwitcher);
                
                // Add event listeners
                languageSwitcher.querySelectorAll('button').forEach(button => {
                    button.addEventListener('click', (e) => {
                        const lang = e.target.getAttribute('data-lang');
                        this.changeLanguage(lang);
                    });
                });
            }
        }
    }

    changeLanguage(lang) {
        if (translations[lang]) {
            this.currentLanguage = lang;
            localStorage.setItem('thaiPlantsLanguage', lang);
            this.applyLanguage(lang);
            
            // Update UI
            document.documentElement.lang = lang;
            
            // Update active state of language buttons
            document.querySelectorAll('.language-switcher button').forEach(button => {
                if (button.getAttribute('data-lang') === lang) {
                    button.classList.add('bg-thai-green', 'text-white');
                    button.classList.remove('bg-gray-200');
                } else {
                    button.classList.remove('bg-thai-green', 'text-white');
                    button.classList.add('bg-gray-200');
                }
            });
        }
    }

    applyLanguage(lang) {
        const t = translations[lang];
        if (!t) return;

        // Update navigation
        this.updateTextContent('[data-i18n="nav.home"]', t.nav.home);
        this.updateTextContent('[data-i18n="nav.products"]', t.nav.products);
        this.updateTextContent('[data-i18n="nav.categories"]', t.nav.categories);
        this.updateTextContent('[data-i18n="nav.about"]', t.nav.about);
        this.updateTextContent('[data-i18n="nav.admin"]', t.nav.admin);

        // Update hero section
        this.updateTextContent('[data-i18n="hero.title"]', t.hero.title);
        this.updateTextContent('[data-i18n="hero.subtitle"]', t.hero.subtitle);
        this.updateTextContent('[data-i18n="hero.cta"]', t.hero.cta);

        // Update products section
        this.updateTextContent('[data-i18n="products.title"]', t.products.title);
        this.updateTextContent('[data-i18n="products.loadMore"]', t.products.loadMore);
        this.updateTextContent('[data-i18n="products.addToCart"]', t.products.addToCart);
        this.updateTextContent('[data-i18n="products.viewDetails"]', t.products.viewDetails);
        this.updateTextContent('[data-i18n="products.price"]', t.products.price);
        
        // Update categories
        this.updateTextContent('[data-i18n="categories.title"]', t.categories.title);
        this.updateTextContent('[data-i18n="categories.all"]', t.categories.all);

        // Update about section
        this.updateTextContent('[data-i18n="about.title"]', t.about.title);
        this.updateTextContent('[data-i18n="about.content"]', t.about.content);
        this.updateTextContent('[data-i18n="about.feature1"]', t.about.feature1);
        this.updateTextContent('[data-i18n="about.feature2"]', t.about.feature2);
        this.updateTextContent('[data-i18n="about.feature3"]', t.about.feature3);

        // Update footer
        this.updateTextContent('[data-i18n="footer.aboutUs"]', t.footer.aboutUs);
        this.updateTextContent('[data-i18n="footer.customerService"]', t.footer.customerService);
        this.updateTextContent('[data-i18n="footer.contact"]', t.footer.contact);
        this.updateTextContent('[data-i18n="footer.followUs"]', t.footer.followUs);
        this.updateTextContent('[data-i18n="footer.copyright"]', t.footer.copyright);
        this.updateTextContent('[data-i18n="footer.newsletter"]', t.footer.newsletter);
    }

    updateTextContent(selector, text) {
        const elements = document.querySelectorAll(selector);
        if (elements && text) {
            elements.forEach(element => {
                element.textContent = text;
            });
        }
    }
}

// Initialize language manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.languageManager = new LanguageManager();
});

export { translations, LanguageManager };
