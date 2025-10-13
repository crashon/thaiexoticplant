// Shop listing and detail utilities
(function(){
    const state = {
        shops: [],
        filtered: [],
        search: '',
        activeFilter: 'all'
    };

    document.addEventListener('DOMContentLoaded', () => {
        if (window.__SHOP_DETAIL__) {
            initShopDetail();
        } else {
            const grid = document.getElementById('shops-grid');
            if (!grid) return;
            loadShops();
            bindControls();
        }
    });

    async function loadShops(){
        try {
            const res = await fetch('tables/shops?limit=200');
            const json = await res.json();
            state.shops = Array.isArray(json.data) ? json.data : [];
        } catch (e){
            console.warn('Load shops fallback:', e);
            state.shops = sampleShops();
        }
        applyFilters();
        render();
    }

    function bindControls(){
        const searchInput = document.getElementById('shop-search');
        const activeSel = document.getElementById('shop-filter-active');
        if (searchInput){
            let t; 
            searchInput.addEventListener('input', (e)=>{
                clearTimeout(t);
                t = setTimeout(()=>{ state.search = e.target.value.trim().toLowerCase(); applyFilters(); render(); }, 250);
            });
        }
        if (activeSel){
            activeSel.addEventListener('change', (e)=>{
                state.activeFilter = e.target.value;
                applyFilters();
                render();
            });
        }
    }

    function applyFilters(){
        const byActive = (shop)=>{
            if (state.activeFilter === 'all') return true;
            if (state.activeFilter === 'active') return shop.is_active;
            if (state.activeFilter === 'inactive') return !shop.is_active;
            return true;
        };
        const bySearch = (shop)=>{
            if (!state.search) return true;
            return (
                (shop.name||'').toLowerCase().includes(state.search) ||
                (shop.description||'').toLowerCase().includes(state.search)
            );
        };
        state.filtered = state.shops.filter(s => byActive(s) && bySearch(s));
    }

    function render(){
        const grid = document.getElementById('shops-grid');
        if (!grid) return;
        if (state.filtered.length === 0){
            grid.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <i class="fas fa-store-slash text-6xl text-gray-300 mb-4"></i>
                    <p class="text-gray-500 text-lg">표시할 샵이 없습니다.</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = state.filtered.map(renderCard).join('');
    }

    function renderCard(shop){
        const activeBadge = shop.is_active
            ? '<span class="px-2 py-0.5 text-xs rounded bg-green-100 text-green-700">활성</span>'
            : '<span class="px-2 py-0.5 text-xs rounded bg-gray-200 text-gray-700">비활성</span>';
        const img = shop.image_url || 'https://images.unsplash.com/photo-1586015555751-63b6062a39fd?w=600';
        return `
            <a href="shop.html?id=${encodeURIComponent(shop.id)}" class="block bg-white rounded-lg shadow shop-card overflow-hidden">
                <div class="h-40 bg-gray-100">
                    <img src="${img}" alt="${escapeHtml(shop.name||'Shop')}" class="w-full h-full object-cover">
                </div>
                <div class="p-4">
                    <div class="flex items-start justify-between mb-2">
                        <h3 class="font-semibold text-lg text-gray-800 line-clamp-1">${escapeHtml(shop.name||'Shop')}</h3>
                        ${activeBadge}
                    </div>
                    <p class="text-sm text-gray-600 line-clamp-2 mb-3">${escapeHtml(shop.description||'')}</p>
                    <div class="text-sm text-gray-500 flex items-center gap-2">
                        <i class="fas fa-user text-gray-400"></i>
                        <span class="truncate">${escapeHtml(shop.owner_name || shop.owner_id || '오너 미지정')}</span>
                    </div>
                </div>
            </a>
        `;
    }

    // Detail page logic
    async function initShopDetail(){
        const params = new URLSearchParams(location.search);
        const shopId = params.get('id');
        if (!shopId){
            renderShopNotFound();
            return;
        }
        let shop;
        try {
            const res = await fetch(`tables/shops?id=${encodeURIComponent(shopId)}`);
            const json = await res.json();
            shop = Array.isArray(json.data) ? json.data[0] : (json.data || null);
        } catch(e){
            console.warn('Shop detail fallback:', e);
        }
        if (!shop){
            shop = sampleShops().find(s=>s.id===shopId) || sampleShops()[0];
        }
        renderShopHeader(shop);
        const products = await loadShopProducts(shop.id);
        renderShopProducts(products);
        bindShopProductsControls(products);
    }

    function renderShopNotFound(){
        const hero = document.getElementById('shop-hero');
        if (!hero) return;
        hero.innerHTML = `
            <div class="p-10 text-center">
                <i class="fas fa-store-slash text-5xl text-gray-300 mb-4"></i>
                <p class="text-gray-600">샵을 찾을 수 없습니다.</p>
            </div>
        `;
    }

    function renderShopHeader(shop){
        const heroImg = document.getElementById('shop-hero-image');
        const nameEl = document.getElementById('shop-name');
        const descEl = document.getElementById('shop-desc');
        const ownerEl = document.getElementById('shop-owner');
        const contactEl = document.getElementById('shop-contact');
        const addrEl = document.getElementById('shop-address');
        const statusEl = document.getElementById('shop-status');
        if (heroImg){
            const img = shop.image_url || 'https://images.unsplash.com/photo-1586015555751-63b6062a39fd?w=1200';
            heroImg.style.backgroundImage = `url('${img}')`;
            heroImg.style.backgroundSize = 'cover';
            heroImg.style.backgroundPosition = 'center';
        }
        if (nameEl) nameEl.textContent = shop.name || 'Shop';
        if (descEl) descEl.textContent = shop.description || '';
        if (ownerEl) ownerEl.textContent = shop.owner_name || shop.owner_id || '-';
        if (contactEl) contactEl.textContent = shop.contact || '-';
        if (addrEl) addrEl.textContent = shop.address || '-';
        if (statusEl){
            statusEl.innerHTML = shop.is_active
                ? '<span class="px-3 py-1 rounded bg-green-100 text-green-700 text-sm">활성</span>'
                : '<span class="px-3 py-1 rounded bg-gray-200 text-gray-700 text-sm">비활성</span>';
        }
    }

    async function loadShopProducts(shopId){
        try {
            const res = await fetch(`tables/products?shop_id=${encodeURIComponent(shopId)}&limit=200`);
            const json = await res.json();
            return Array.isArray(json.data) ? json.data : [];
        } catch (e){
            console.warn('Load shop products fallback:', e);
            return sampleProducts(shopId);
        }
    }

    function renderShopProducts(list){
        const grid = document.getElementById('shop-products-grid');
        if (!grid) return;
        if (!list || list.length === 0){
            grid.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <i class="fas fa-box-open text-6xl text-gray-300 mb-4"></i>
                    <p class="text-gray-500 text-lg">등록된 상품이 없습니다.</p>
                </div>
            `;
            return;
        }
        grid.innerHTML = list.map(p=>`
            <div class="product-card bg-white rounded-lg shadow-md overflow-hidden">
                <div class="h-40 bg-gray-100">
                    ${p.images && p.images[0] ? `<img src="${p.images[0]}" alt="${escapeHtml(p.name)}" class="w-full h-full object-cover">` : ''}
                </div>
                <div class="p-4">
                    <h3 class="font-semibold text-lg mb-1 text-gray-800 line-clamp-1">${escapeHtml(p.name)}</h3>
                    <p class="text-sm text-gray-500 mb-2 line-clamp-2">${escapeHtml(p.description||'')}</p>
                    <div class="flex items-center justify-between">
                        <div>
                            <span class="font-semibold text-plant-green">${(p.price||0).toLocaleString()} ฿</span>
                            <span class="block text-xs text-gray-500">$${p.price_usd||0}</span>
                        </div>
                        <span class="text-xs text-gray-500">재고 ${p.stock_quantity||0}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    function bindShopProductsControls(all){
        const search = document.getElementById('shop-products-search');
        const sort = document.getElementById('shop-products-sort');
        let working = all.slice();
        const rerender = ()=>{
            renderShopProducts(working);
        };
        const apply = ()=>{
            const q = (search?.value||'').trim().toLowerCase();
            const sortVal = sort?.value || 'created_at-desc';
            working = all.filter(p=>{
                if (!q) return true;
                return (p.name||'').toLowerCase().includes(q) || (p.korean_name||'').toLowerCase().includes(q);
            });
            if (sortVal === 'price-asc') working.sort((a,b)=>(a.price||0)-(b.price||0));
            else if (sortVal === 'price-desc') working.sort((a,b)=>(b.price||0)-(a.price||0));
            else working.sort((a,b)=> ((b.created_at||'') > (a.created_at||'')) ? 1 : -1);
            rerender();
        };
        if (search){ let t; search.addEventListener('input', ()=>{ clearTimeout(t); t=setTimeout(apply, 200); }); }
        if (sort){ sort.addEventListener('change', apply); }
    }

    function sampleProducts(shopId){
        return [
            { id:'p1', shop_id: shopId, name:'Monstera Thai Constellation', price:15000, price_usd:450, images:['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400'], description:'희귀 몬스테라', stock_quantity:5 },
            { id:'p2', shop_id: shopId, name:'Aglaonema Red Valentine', price:2800, price_usd:85, images:['https://images.unsplash.com/photo-1440589473619-3cde28941638?w=400'], description:'관엽식물', stock_quantity:12 }
        ];
    }

    function escapeHtml(str){
        return String(str)
            .replace(/&/g,'&amp;')
            .replace(/</g,'&lt;')
            .replace(/>/g,'&gt;')
            .replace(/"/g,'&quot;')
            .replace(/'/g,'&#39;');
    }

    function sampleShops(){
        return [
            { id: 's1', name: 'Bangkok Rare Aroids', description: '방콕 희귀 아로이드 전문 샵', owner_id: 'owner1', owner_name: 'Anan', is_active: true, image_url: 'https://images.unsplash.com/photo-1586015555751-63b6062a39fd?w=800' },
            { id: 's2', name: 'Chiang Mai Succulents', description: '치앙마이 다육/선인장 샵', owner_id: 'owner2', owner_name: 'Nok', is_active: true, image_url: 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=800' },
            { id: 's3', name: 'Phuket Tropicals', description: '푸켓 열대 관엽 전문', owner_id: 'owner3', owner_name: 'Mali', is_active: false, image_url: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800' }
        ];
    }
})();


