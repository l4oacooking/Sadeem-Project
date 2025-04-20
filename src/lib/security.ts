import DOMPurify from 'dompurify';

/**
 * Sanitizes user input to prevent XSS attacks
 * @param input The user input to sanitize
 * @returns Sanitized input
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // Strip all HTML tags
    ALLOWED_ATTR: [], // Strip all attributes
  });
}

/**
 * Sanitizes HTML content while preserving safe HTML tags
 * @param html The HTML content to sanitize
 * @returns Sanitized HTML
 */
export function sanitizeHTML(html: string): string {
  if (!html) return '';
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * Sanitizes an object's string values recursively
 * @param obj The object to sanitize
 * @returns Sanitized object
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized as T;
}

/**
 * Validates and sanitizes a URL
 * @param url The URL to validate and sanitize
 * @returns Sanitized URL or null if invalid
 */
export function sanitizeURL(url: string): string | null {
  try {
    const sanitized = sanitizeInput(url);
    const parsed = new URL(sanitized);
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }
    return sanitized;
  } catch {
    return null;
  }
}

/**
 * Creates a safe HTML element with sanitized content
 * @param tag The HTML tag name
 * @param content The content to insert
 * @param attributes Optional attributes to add
 * @returns A safe HTML element
 */
export function createSafeElement(
  tag: string,
  content: string,
  attributes: Record<string, string> = {}
): HTMLElement {
  const element = document.createElement(tag);
  const sanitizedContent = sanitizeHTML(content);
  element.innerHTML = sanitizedContent;

  // Add sanitized attributes
  Object.entries(attributes).forEach(([key, value]) => {
    if (key === 'href') {
      const sanitizedUrl = sanitizeURL(value);
      if (sanitizedUrl) {
        element.setAttribute(key, sanitizedUrl);
      }
    } else {
      element.setAttribute(key, sanitizeInput(value));
    }
  });

  return element;
}

/**
 * Escapes special characters in a string to prevent SQL injection
 * @param str The string to escape
 * @returns Escaped string
 */
export function escapeSQL(str: string): string {
  if (!str) return '';
  return str
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
    .replace(/\b/g, '\\b')
    .replace(/\f/g, '\\f');
}

/**
 * Validates and sanitizes a phone number
 * @param phone The phone number to validate
 * @returns Sanitized phone number or null if invalid
 */
export function sanitizePhone(phone: string): string | null {
  const sanitized = sanitizeInput(phone);
  // Basic phone number validation (can be enhanced based on requirements)
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(sanitized) ? sanitized : null;
}

/**
 * Validates and sanitizes an email address
 * @param email The email to validate
 * @returns Sanitized email or null if invalid
 */
export function sanitizeEmail(email: string): string | null {
  const sanitized = sanitizeInput(email);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(sanitized) ? sanitized : null;
}

/**
 * Creates a safe URL for redirects
 * @param url The URL to make safe
 * @param allowedDomains List of allowed domains
 * @returns Safe URL or null if not allowed
 */
export function createSafeRedirectURL(
  url: string,
  allowedDomains: string[]
): string | null {
  try {
    const sanitized = sanitizeURL(url);
    if (!sanitized) return null;

    const parsed = new URL(sanitized);
    if (!allowedDomains.includes(parsed.hostname)) {
      return null;
    }

    return sanitized;
  } catch {
    return null;
  }
} 