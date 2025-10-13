// Shop Owner dashboard minimal scaffold to visualize metrics and products
(function(){
    document.addEventListener('DOMContentLoaded', init);

    async function init(){
        await loadMetrics();
        await loadOwnerProducts();
        setupChart();
        bindSearch();
    }

    async function loadMetrics(){
        // Placeholder metrics using simple sums over orders; fallback values used if API not present
        let orders = [];
        try {
            const res = await fetch('tables/orders?limit=500');
            const json = await res.json();
            orders = Array.isArray(json.data) ? json.data : [];
        } catch (e){}
        const today = new Date().toISOString().slice(0,10);
        const month = new Date().toISOString().slice(0,7);
        const sum = (arr)=>arr.reduce((s,o)=> s + (o.total_amount||0), 0);
        const todaySum = sum(orders.filter(o=> (o.created_at||'').startsWith(today)));
        const monthSum = sum(orders.filter(o=> (o.created_at||'').startsWith(month)));
        setText('metric-today', fmtTHB(todaySum));
        setText('metric-month', fmtTHB(monthSum));
        // Product metrics from products table
        let products = [];
        try {
            const res = await fetch('tables/products?limit=500');
            const json = await res.json();
            products = Array.isArray(json.data) ? json.data : [];
        } catch(e){ products = []; }
        setText('metric-products', String(products.length));
        const low = products.filter(p => (p.stock_quantity||0) <= 5).length;
        setText('metric-lowstock', String(low));
    }

    function setText(id, v){ const el = document.getElementById(id); if (el) el.textContent = v; }
    function fmtTHB(n){ return `${(n||0).toLocaleString()} ฿`; }

    function setupChart(){
        const ctx = document.getElementById('sales-chart');
        if (!ctx || !window.Chart) return;
        const days = 30;
        const labels = Array.from({length: days}, (_,i)=>{
            const d = new Date(); d.setDate(d.getDate()-(days-1-i));
            return `${d.getMonth()+1}/${d.getDate()}`;
        });
        const data = labels.map(()=> Math.floor(Math.random()*50000));
        new Chart(ctx, {
            type: 'line',
            data: { labels, datasets: [{ label: '매출', data, borderColor: '#4ade80', backgroundColor: 'rgba(74,222,128,.2)', tension:.3 }]},
            options: { plugins:{legend:{display:false}}, scales:{ y:{ ticks:{ callback:(v)=>`${v.toLocaleString()} ฿` }}} }
        });
    }

    async function loadOwnerProducts(){
        let products = [];
        try {
            const res = await fetch('tables/products?limit=200');
            const json = await res.json();
            products = Array.isArray(json.data) ? json.data : [];
        } catch (e){
            products = sampleProducts();
        }
        renderOwnerProducts(products);
        window.__OWNER_PRODUCTS__ = products;
    }

    function renderOwnerProducts(list){
        const grid = document.getElementById('owner-products-grid');
        if (!grid) return;
        if (!list || list.length === 0){
            grid.innerHTML = `<div class="col-span-full text-center text-gray-500 py-10">상품이 없습니다.</div>`;
            return;
        }
        grid.innerHTML = list.map(p=>`
            <div class="product-card bg-white rounded-lg shadow-md overflow-hidden">
                <div class="h-36 bg-gray-100">${p.images && p.images[0] ? `<img src="${p.images[0]}" class="w-full h-full object-cover">` : ''}</div>
                <div class="p-4">
                    <div class="flex items-start justify-between">
                        <h3 class="font-semibold text-gray-800 line-clamp-1">${escapeHtml(p.name)}</h3>
                        <span class="text-xs text-gray-500">재고 ${p.stock_quantity||0}</span>
                    </div>
                    <div class="text-plant-green font-semibold">${fmtTHB(p.price||0)}</div>
                    <div class="mt-3 grid grid-cols-2 gap-2 text-sm">
                        <button class="px-3 py-2 bg-gray-100 rounded">수정</button>
                        <button class="px-3 py-2 bg-red-100 text-red-700 rounded">삭제</button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    function bindSearch(){
        const input = document.getElementById('owner-products-search');
        if (!input) return;
        let t; input.addEventListener('input', ()=>{
            clearTimeout(t); t = setTimeout(()=>{
                const q = input.value.trim().toLowerCase();
                const base = window.__OWNER_PRODUCTS__ || [];
                const filtered = base.filter(p => (p.name||'').toLowerCase().includes(q) || (p.korean_name||'').toLowerCase().includes(q));
                renderOwnerProducts(filtered);
            }, 200);
        });
    }

    function escapeHtml(str){
        return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
    }
    function sampleProducts(){
        return [
            { id:'p1', name:'Monstera Thai Constellation', price:15000, images:['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400'], stock_quantity:5 },
            { id:'p2', name:'Aglaonema Red Valentine', price:2800, images:['https://images.unsplash.com/photo-1440589473619-3cde28941638?w=400'], stock_quantity:12 }
        ];
    }
})();


