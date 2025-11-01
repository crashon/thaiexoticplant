// payment.js - Payment Processing System for Thai Exotic Plants

const PaymentManager = {
  apiBaseUrl: 'http://localhost:3000',
  stripe: null,
  stripeElements: null,
  paypalButtons: null,
  config: null,

  // Initialize payment systems
  async initialize() {
    try {
      // Fetch payment configuration
      const response = await fetch(`${this.apiBaseUrl}/api/payments/config`);
      this.config = await response.json();

      console.log('Payment config loaded:', this.config);

      // Initialize Stripe if enabled
      if (this.config.stripe.enabled && this.config.stripe.publishableKey) {
        await this.initializeStripe();
      }

      // Initialize PayPal if enabled
      if (this.config.paypal.enabled && this.config.paypal.clientId) {
        await this.initializePayPal();
      }
    } catch (error) {
      console.error('Error initializing payment systems:', error);
    }
  },

  // Initialize Stripe
  async initializeStripe() {
    if (!window.Stripe) {
      console.error('Stripe.js not loaded');
      return;
    }

    this.stripe = window.Stripe(this.config.stripe.publishableKey);
    console.log('Stripe initialized');
  },

  // Initialize PayPal
  async initializePayPal() {
    // PayPal SDK should be loaded via script tag
    if (!window.paypal) {
      console.error('PayPal SDK not loaded');
      return;
    }

    console.log('PayPal ready');
  },

  // Render payment options
  renderPaymentOptions(containerId, amount, currency = 'THB', orderId = null) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let html = '<div class="space-y-4">';

    // Payment method selection
    html += `
      <div class="bg-white rounded-lg p-6 shadow-md">
        <h3 class="text-xl font-bold mb-4">결제 방법 선택</h3>
        <div class="space-y-3">
    `;

    if (this.config?.stripe.enabled) {
      html += `
        <label class="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:border-plant-green transition-colors">
          <input type="radio" name="payment-method" value="stripe" class="mr-3" checked>
          <div class="flex items-center">
            <i class="fab fa-cc-stripe text-3xl text-blue-600 mr-3"></i>
            <div>
              <div class="font-semibold">신용/체크카드</div>
              <div class="text-sm text-gray-500">Stripe 안전결제</div>
            </div>
          </div>
        </label>
      `;
    }

    if (this.config?.paypal.enabled) {
      html += `
        <label class="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:border-plant-green transition-colors">
          <input type="radio" name="payment-method" value="paypal" class="mr-3" ${!this.config?.stripe.enabled ? 'checked' : ''}>
          <div class="flex items-center">
            <i class="fab fa-paypal text-3xl text-blue-500 mr-3"></i>
            <div>
              <div class="font-semibold">PayPal</div>
              <div class="text-sm text-gray-500">PayPal 계정으로 결제</div>
            </div>
          </div>
        </label>
      `;
    }

    html += `
        </div>
      </div>
    `;

    // Payment details container
    html += `
      <div id="payment-details-container"></div>
      <div id="payment-message" class="hidden"></div>
    `;

    html += '</div>';

    container.innerHTML = html;

    // Add event listeners
    document.querySelectorAll('input[name="payment-method"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        this.handlePaymentMethodChange(e.target.value, amount, currency, orderId);
      });
    });

    // Trigger initial payment method
    const selectedMethod = document.querySelector('input[name="payment-method"]:checked')?.value;
    if (selectedMethod) {
      this.handlePaymentMethodChange(selectedMethod, amount, currency, orderId);
    }
  },

  // Handle payment method change
  handlePaymentMethodChange(method, amount, currency, orderId) {
    const container = document.getElementById('payment-details-container');
    if (!container) return;

    if (method === 'stripe') {
      this.renderStripeForm(container, amount, currency, orderId);
    } else if (method === 'paypal') {
      this.renderPayPalButtons(container, amount, currency, orderId);
    }
  },

  // Render Stripe payment form
  async renderStripeForm(container, amount, currency, orderId) {
    if (!this.stripe) {
      container.innerHTML = '<p class="text-red-600">Stripe가 초기화되지 않았습니다.</p>';
      return;
    }

    container.innerHTML = `
      <div class="bg-white rounded-lg p-6 shadow-md">
        <h4 class="text-lg font-semibold mb-4">카드 정보 입력</h4>
        <form id="stripe-payment-form">
          <div id="stripe-card-element" class="p-4 border border-gray-300 rounded-lg mb-4"></div>
          <div id="stripe-card-errors" class="text-red-600 text-sm mb-4"></div>
          <button type="submit" id="stripe-submit-button"
                  class="w-full bg-plant-green text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors font-medium">
            <span id="button-text">${amount.toLocaleString()} ${currency} 결제하기</span>
            <span id="spinner" class="hidden"><i class="fas fa-spinner fa-spin"></i></span>
          </button>
        </form>
      </div>
    `;

    // Create Stripe Elements
    const elements = this.stripe.elements();
    const cardElement = elements.create('card', {
      style: {
        base: {
          fontSize: '16px',
          color: '#32325d',
          fontFamily: '"Noto Sans KR", sans-serif',
          '::placeholder': {
            color: '#aab7c4'
          }
        }
      }
    });

    cardElement.mount('#stripe-card-element');

    // Handle form submission
    const form = document.getElementById('stripe-payment-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await this.handleStripePayment(cardElement, amount, currency, orderId);
    });

    // Handle card errors
    cardElement.on('change', (event) => {
      const displayError = document.getElementById('stripe-card-errors');
      if (event.error) {
        displayError.textContent = event.error.message;
      } else {
        displayError.textContent = '';
      }
    });
  },

  // Handle Stripe payment
  async handleStripePayment(cardElement, amount, currency, orderId) {
    const submitButton = document.getElementById('stripe-submit-button');
    const buttonText = document.getElementById('button-text');
    const spinner = document.getElementById('spinner');

    // Disable button and show spinner
    submitButton.disabled = true;
    buttonText.classList.add('hidden');
    spinner.classList.remove('hidden');

    try {
      // Create payment intent
      const response = await fetch(`${this.apiBaseUrl}/api/payments/stripe/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount,
          currency,
          orderId
        })
      });

      const { clientSecret, paymentIntentId } = await response.json();

      // Confirm card payment
      const { error, paymentIntent } = await this.stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement
        }
      });

      if (error) {
        this.showPaymentMessage(error.message, 'error');
      } else if (paymentIntent.status === 'succeeded') {
        this.showPaymentMessage('결제가 완료되었습니다!', 'success');
        // Redirect or update UI
        setTimeout(() => {
          window.location.href = `/order-complete.html?orderId=${orderId}&paymentId=${paymentIntent.id}`;
        }, 2000);
      }
    } catch (error) {
      console.error('Payment error:', error);
      this.showPaymentMessage('결제 처리 중 오류가 발생했습니다.', 'error');
    } finally {
      // Re-enable button
      submitButton.disabled = false;
      buttonText.classList.remove('hidden');
      spinner.classList.add('hidden');
    }
  },

  // Render PayPal buttons
  async renderPayPalButtons(container, amount, currency, orderId) {
    if (!window.paypal) {
      container.innerHTML = '<p class="text-red-600">PayPal SDK가 로드되지 않았습니다.</p>';
      return;
    }

    container.innerHTML = `
      <div class="bg-white rounded-lg p-6 shadow-md">
        <h4 class="text-lg font-semibold mb-4">PayPal로 결제하기</h4>
        <div id="paypal-button-container"></div>
      </div>
    `;

    // Convert THB to USD if needed (PayPal doesn't support THB directly)
    const paypalAmount = currency === 'THB' ? (amount / 33).toFixed(2) : amount;
    const paypalCurrency = currency === 'THB' ? 'USD' : currency;

    window.paypal.Buttons({
      createOrder: async () => {
        try {
          const response = await fetch(`${this.apiBaseUrl}/api/payments/paypal/create-order`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              amount: parseFloat(paypalAmount),
              currency: paypalCurrency,
              orderId
            })
          });

          const data = await response.json();
          return data.orderId;
        } catch (error) {
          console.error('Error creating PayPal order:', error);
          this.showPaymentMessage('PayPal 주문 생성 실패', 'error');
        }
      },
      onApprove: async (data) => {
        try {
          const response = await fetch(`${this.apiBaseUrl}/api/payments/paypal/capture-order`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              orderID: data.orderID
            })
          });

          const details = await response.json();
          if (details.success) {
            this.showPaymentMessage('결제가 완료되었습니다!', 'success');
            setTimeout(() => {
              window.location.href = `/order-complete.html?orderId=${orderId}&paymentId=${data.orderID}`;
            }, 2000);
          }
        } catch (error) {
          console.error('Error capturing PayPal order:', error);
          this.showPaymentMessage('결제 처리 중 오류가 발생했습니다.', 'error');
        }
      },
      onError: (err) => {
        console.error('PayPal error:', err);
        this.showPaymentMessage('PayPal 결제 중 오류가 발생했습니다.', 'error');
      }
    }).render('#paypal-button-container');
  },

  // Show payment message
  showPaymentMessage(message, type = 'info') {
    const container = document.getElementById('payment-message');
    if (!container) return;

    const colors = {
      success: 'bg-green-100 text-green-800 border-green-200',
      error: 'bg-red-100 text-red-800 border-red-200',
      info: 'bg-blue-100 text-blue-800 border-blue-200'
    };

    container.innerHTML = `
      <div class="p-4 rounded-lg border ${colors[type]}">
        ${message}
      </div>
    `;
    container.classList.remove('hidden');

    // Auto hide after 5 seconds
    if (type !== 'error') {
      setTimeout(() => {
        container.classList.add('hidden');
      }, 5000);
    }
  }
};

// Make it available globally
window.PaymentManager = PaymentManager;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  PaymentManager.initialize();
});
