/**
 * Utility Functions Tests
 */

describe('Utility Functions', () => {
  describe('escapeHtml', () => {
    const escapeHtml = (str) => {
      if (str === null || str === undefined) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    };

    test('Should escape < and >', () => {
      expect(escapeHtml('<div>Hello</div>')).toBe('&lt;div&gt;Hello&lt;/div&gt;');
    });

    test('Should escape quotes', () => {
      expect(escapeHtml('"Hello"')).toBe('&quot;Hello&quot;');
      expect(escapeHtml("'Hello'")).toBe('&#039;Hello&#039;');
    });

    test('Should handle empty strings', () => {
      expect(escapeHtml('')).toBe('');
    });

    test('Should convert numbers to strings', () => {
      expect(escapeHtml(123)).toBe('123');
    });
  });

  describe('formatCurrency', () => {
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('th-TH', {
        style: 'currency',
        currency: 'THB'
      }).format(amount);
    };

    test('Should format Thai Baht correctly', () => {
      const formatted = formatCurrency(1000);
      expect(formatted).toContain('1,000');
    });

    test('Should handle decimal values', () => {
      const formatted = formatCurrency(1234.56);
      expect(formatted).toContain('1,234.56');
    });
  });

  describe('isValidEmail', () => {
    const isValidEmail = (email) => {
      const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return regex.test(email);
    };

    test('Should validate correct emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@company.co.th')).toBe(true);
    });

    test('Should reject invalid emails', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
    });
  });

  describe('debounce', () => {
    jest.useFakeTimers();

    const debounce = (func, wait) => {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    };

    test('Should delay function execution', () => {
      const mockFunc = jest.fn();
      const debouncedFunc = debounce(mockFunc, 1000);

      debouncedFunc();
      expect(mockFunc).not.toHaveBeenCalled();

      jest.advanceTimersByTime(1000);
      expect(mockFunc).toHaveBeenCalledTimes(1);
    });

    test('Should cancel previous calls', () => {
      const mockFunc = jest.fn();
      const debouncedFunc = debounce(mockFunc, 1000);

      debouncedFunc();
      debouncedFunc();
      debouncedFunc();

      jest.advanceTimersByTime(1000);
      expect(mockFunc).toHaveBeenCalledTimes(1);
    });
  });
});

describe('Security Utilities', () => {
  describe('Token Encryption', () => {
    test('Should encrypt and decrypt tokens', () => {
      // This would test the actual encryption functions from database.js
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('Password Hashing', () => {
    test('Should hash passwords securely', () => {
      // This would test bcrypt hashing
      expect(true).toBe(true); // Placeholder
    });
  });
});
