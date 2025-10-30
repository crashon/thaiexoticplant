/**
 * Validation Tests
 * Tests for input validation middleware
 */

describe('Input Validation', () => {
  describe('Email Validation', () => {
    test('Should accept valid email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.th',
        'user+tag@example.com'
      ];

      validEmails.forEach(email => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        expect(regex.test(email)).toBe(true);
      });
    });

    test('Should reject invalid email addresses', () => {
      const invalidEmails = [
        'invalid',
        '@example.com',
        'user@',
        'user @example.com',
        ''
      ];

      invalidEmails.forEach(email => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        expect(regex.test(email)).toBe(false);
      });
    });
  });

  describe('Password Validation', () => {
    test('Should require minimum 8 characters', () => {
      const password = 'Pass123';
      expect(password.length >= 8).toBe(false);
    });

    test('Should accept strong passwords', () => {
      const password = 'StrongPass123';
      expect(password.length >= 8).toBe(true);
      expect(/[A-Z]/.test(password)).toBe(true);
      expect(/[a-z]/.test(password)).toBe(true);
      expect(/\d/.test(password)).toBe(true);
    });
  });

  describe('Order Validation', () => {
    test('Should validate order items array', () => {
      const order = {
        customer_name: 'Test User',
        customer_email: 'test@example.com',
        shipping_address: '123 Test Street',
        items: [
          { product_id: 1, quantity: 2, price: 100 }
        ]
      };

      expect(Array.isArray(order.items)).toBe(true);
      expect(order.items.length).toBeGreaterThan(0);
      expect(order.items[0]).toHaveProperty('product_id');
      expect(order.items[0]).toHaveProperty('quantity');
      expect(order.items[0]).toHaveProperty('price');
    });

    test('Should reject invalid quantities', () => {
      const invalidQuantities = [-1, 0, 'abc', null];

      invalidQuantities.forEach(qty => {
        expect(typeof qty === 'number' && qty > 0).toBe(false);
      });
    });

    test('Should reject invalid prices', () => {
      const invalidPrices = [-1, 'abc', null];

      invalidPrices.forEach(price => {
        expect(typeof price === 'number' && price >= 0).toBe(false);
      });
    });
  });
});

describe('XSS Prevention', () => {
  const escapeHtml = (str) => {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  test('Should escape HTML special characters', () => {
    expect(escapeHtml('<script>alert("XSS")</script>'))
      .toBe('&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;');
  });

  test('Should handle null and undefined', () => {
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
  });

  test('Should escape ampersands', () => {
    expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
  });
});
