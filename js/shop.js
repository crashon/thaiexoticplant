// Shop listing and detail utilities
(function(){
    const state = {
        shops: [],
        filtered: [],
        search: '',
        activeFilter: 'all'
    };

    document.addEventListener('DOMContentLoaded', () => {
        const grid = document.getElementById('shops-grid');
        if (!grid) return;
        loadShops();
        bindControls();
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


