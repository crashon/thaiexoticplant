// Shopping Cart functionality for Thai Exotic Plants

// Cart state management
let isCartOpen = false;

// Initialize cart from localStorage
function initializeCart() {
    cart = JSON.parse(localStorage.getItem('thaiPlantsCart')) || [];
    updateCartUI();
}

// Add item to cart
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) {
        showNotification('상품을 찾을 수 없습니다.', 'error');
        return;
    }

    if (product.stock_quantity <= 0) {
        showNotification('품절된 상품입니다.', 'error');
        return;
    }

    // Check if item already in cart
    const existingItem = cart.find(item => item.productId === productId);
    
    if (existingItem) {
        if (existingItem.quantity >= product.stock_quantity) {
            showNotification('재고가 부족합니다.', 'error');
            return;
        }
        existingItem.quantity++;
    } else {
        cart.push({
            productId: productId,
            quantity: 1,
            price: product.price,
            priceUsd: product.price_usd,
            name: product.name,
            koreanName: product.korean_name,
            image: product.images && product.images.length > 0 ? product.images[0] : null
        });
    }

    saveCartToStorage();
    updateCartUI();
    showNotification('장바구니에 추가되었습니다.', 'success');
    
    // Add visual feedback to button
    const button = event.target.closest('.add-to-cart-btn');
    if (button) {
        button.classList.add('added');
        setTimeout(() => {
            button.classList.remove('added');
        }, 1000);
    }
}

// Remove item from cart
function removeFromCart(productId) {
    cart = cart.filter(item => item.productId !== productId);
    saveCartToStorage();
    updateCartUI();
    showNotification('상품이 제거되었습니다.', 'info');
}

// Update item quantity
function updateQuantity(productId, quantity) {
    const item = cart.find(item => item.productId === productId);
    if (!item) return;
    
    const product = products.find(p => p.id === productId);
    if (!product) return;

    if (quantity <= 0) {
        removeFromCart(productId);
        return;
    }

    if (quantity > product.stock_quantity) {
        showNotification('재고가 부족합니다.', 'error');
        return;
    }

    item.quantity = quantity;
    saveCartToStorage();
    updateCartUI();
}

// Save cart to localStorage
function saveCartToStorage() {
    localStorage.setItem('thaiPlantsCart', JSON.stringify(cart));
}

// Toggle cart sidebar
function toggleCart() {
    const cartSidebar = document.getElementById('cart-sidebar');
    const cartOverlay = document.getElementById('cart-overlay');
    
    if (isCartOpen) {
        cartSidebar.classList.add('translate-x-full');
        cartOverlay.classList.add('hidden');
        isCartOpen = false;
    } else {
        cartSidebar.classList.remove('translate-x-full');
        cartOverlay.classList.remove('hidden');
        isCartOpen = true;
        renderCartItems();
    }
}

// Update cart UI
function updateCartUI() {
    const cartCount = document.getElementById('cart-count');
    const cartTotal = document.getElementById('cart-total');
    
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Update cart count badge
    if (totalItems > 0) {
        cartCount.textContent = totalItems;
        cartCount.classList.remove('hidden');
    } else {
        cartCount.classList.add('hidden');
    }
    
    // Update cart total
    if (cartTotal) {
        cartTotal.textContent = `${totalAmount.toLocaleString()} ฿`;
    }
}

// Render cart items
function renderCartItems() {
    const cartItemsContainer = document.getElementById('cart-items');
    
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-shopping-cart text-4xl text-gray-300 mb-4"></i>
                <p class="text-gray-500">장바구니가 비어있습니다.</p>
                <button onclick="toggleCart()" class="mt-4 bg-plant-green text-white px-6 py-2 rounded-lg hover:bg-green-600 transition duration-300">
                    쇼핑 계속하기
                </button>
            </div>
        `;
        return;
    }
    
    cartItemsContainer.innerHTML = cart.map(item => `
        <div class="cart-item border-b border-gray-200 pb-4 mb-4 last:border-b-0">
            <div class="flex items-start space-x-3">
                <div class="w-16 h-16 flex-shrink-0">
                    ${item.image ? 
                        `<img src="${item.image}" alt="${item.name}" class="w-full h-full object-cover rounded">` :
                        `<div class="w-full h-full bg-gray-200 rounded flex items-center justify-center">
                            <i class="fas fa-seedling text-gray-400"></i>
                        </div>`
                    }
                </div>
                <div class="flex-1 min-w-0">
                    <h4 class="font-medium text-sm text-gray-900 truncate">${item.name}</h4>
                    <p class="text-xs text-gray-500 truncate">${item.koreanName}</p>
                    <p class="text-sm font-semibold text-plant-green mt-1">${item.price.toLocaleString()} ฿</p>
                </div>
                <button onclick="removeFromCart('${item.productId}')" class="text-red-500 hover:text-red-700">
                    <i class="fas fa-trash text-sm"></i>
                </button>
            </div>
            
            <div class="flex items-center justify-between mt-3">
                <div class="flex items-center space-x-2">
                    <button onclick="updateQuantity('${item.productId}', ${item.quantity - 1})" 
                            class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition duration-200">
                        <i class="fas fa-minus text-xs"></i>
                    </button>
                    <span class="w-8 text-center font-medium">${item.quantity}</span>
                    <button onclick="updateQuantity('${item.productId}', ${item.quantity + 1})" 
                            class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition duration-200">
                        <i class="fas fa-plus text-xs"></i>
                    </button>
                </div>
                <div class="text-right">
                    <p class="font-semibold text-gray-900">${(item.price * item.quantity).toLocaleString()} ฿</p>
                    <p class="text-xs text-gray-500">$${(item.priceUsd * item.quantity).toFixed(2)}</p>
                </div>
            </div>
        </div>
    `).join('');
}

// Checkout function
function checkout() {
    if (cart.length === 0) {
        showNotification('장바구니가 비어있습니다.', 'error');
        return;
    }
    
    showCheckoutModal();
}

// Show checkout modal
function showCheckoutModal() {
    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalAmountUsd = cart.reduce((sum, item) => sum + (item.priceUsd * item.quantity), 0);
    
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
        <div class="modal-content max-w-2xl">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-bold text-thai-green">주문하기</h2>
                <button onclick="closeModal()" class="text-gray-500 hover:text-gray-700">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            
            <form id="checkout-form" class="space-y-4">
                <div class="grid md:grid-cols-2 gap-4">
                    <div class="form-group">
                        <label class="form-label">고객명 *</label>
                        <input type="text" name="customerName" class="form-input" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">이메일 *</label>
                        <input type="email" name="customerEmail" class="form-input" required>
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">전화번호 *</label>
                    <input type="tel" name="customerPhone" class="form-input" required>
                </div>
                
                <div class="form-group">
                    <label class="form-label">배송 주소 *</label>
                    <textarea name="shippingAddress" class="form-input form-textarea" required 
                              placeholder="상세 주소를 입력해주세요"></textarea>
                </div>
                
                <div class="form-group">
                    <label class="form-label">배송 방법</label>
                    <select name="shippingMethod" class="form-input">
                        <option value="standard">일반 배송 (7-14일)</option>
                        <option value="express">빠른 배송 (3-7일, 추가 요금)</option>
                        <option value="special">식물 전용 배송 (5-10일, 온도 조절)</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label">결제 통화</label>
                    <select name="currency" class="form-input">
                        <option value="THB">태국 바트 (THB)</option>
                        <option value="USD">미국 달러 (USD)</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label class="form-label">주문 메모</label>
                    <textarea name="notes" class="form-input form-textarea" 
                              placeholder="특별한 요청사항이 있으시면 적어주세요"></textarea>
                </div>
            </form>
            
            <!-- Order Summary -->
            <div class="bg-gray-50 p-4 rounded-lg mt-6">
                <h3 class="font-semibold mb-3">주문 요약</h3>
                <div class="space-y-2 text-sm">
                    ${cart.map(item => `
                        <div class="flex justify-between">
                            <span>${item.name} × ${item.quantity}</span>
                            <span>${(item.price * item.quantity).toLocaleString()} ฿</span>
                        </div>
                    `).join('')}
                </div>
                <div class="border-t pt-2 mt-2">
                    <div class="flex justify-between font-semibold">
                        <span>총 금액:</span>
                        <div class="text-right">
                            <div>${totalAmount.toLocaleString()} ฿</div>
                            <div class="text-xs text-gray-500">($${totalAmountUsd.toFixed(2)})</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="flex gap-3 mt-6">
                <button type="button" onclick="closeModal()" 
                        class="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition duration-300">
                    취소
                </button>
                <button type="button" onclick="submitOrder()" 
                        class="flex-1 bg-plant-green text-white py-3 rounded-lg hover:bg-green-600 transition duration-300">
                    주문 완료
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Submit order
async function submitOrder() {
    const form = document.getElementById('checkout-form');
    const formData = new FormData(form);
    
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const orderData = {
        order_number: generateOrderNumber(),
        customer_name: formData.get('customerName'),
        customer_email: formData.get('customerEmail'),
        customer_phone: formData.get('customerPhone'),
        shipping_address: formData.get('shippingAddress'),
        shipping_method: formData.get('shippingMethod'),
        currency: formData.get('currency'),
        notes: formData.get('notes'),
        payment_status: '대기',
        order_status: '접수',
        total_amount: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    };
    
    try {
        // Create order
        const orderResponse = await fetch('tables/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });
        
        if (!orderResponse.ok) {
            throw new Error('주문 생성에 실패했습니다.');
        }
        
        const order = await orderResponse.json();
        
        // Create order items
        for (const item of cart) {
            const orderItemData = {
                order_id: order.id,
                product_id: item.productId,
                product_name: item.name,
                quantity: item.quantity,
                unit_price: item.price,
                total_price: item.price * item.quantity
            };
            
            await fetch('tables/order_items', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(orderItemData)
            });
        }
        
        // Clear cart
        cart = [];
        saveCartToStorage();
        updateCartUI();
        
        closeModal();
        toggleCart();
        
        showOrderSuccessModal(order.order_number);
        
    } catch (error) {
        console.error('Order submission error:', error);
        showNotification('주문 처리 중 오류가 발생했습니다. 다시 시도해주세요.', 'error');
    }
}

// Generate order number
function generateOrderNumber() {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const time = now.getTime().toString().slice(-6);
    
    return `TP${year}${month}${day}${time}`;
}

// Show order success modal
function showOrderSuccessModal(orderNumber) {
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
        <div class="modal-content text-center">
            <div class="mb-6">
                <i class="fas fa-check-circle text-6xl text-green-500 mb-4"></i>
                <h2 class="text-2xl font-bold text-thai-green mb-2">주문이 완료되었습니다!</h2>
                <p class="text-gray-600">주문번호: <span class="font-semibold">${orderNumber}</span></p>
            </div>
            
            <div class="bg-green-50 p-4 rounded-lg mb-6">
                <p class="text-sm text-green-800">
                    주문 확인 이메일이 발송되었습니다.<br>
                    결제 안내는 별도로 연락드리겠습니다.
                </p>
            </div>
            
            <button onclick="closeModal()" 
                    class="w-full bg-plant-green text-white py-3 rounded-lg hover:bg-green-600 transition duration-300">
                확인
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Initialize cart when page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeCart();
});