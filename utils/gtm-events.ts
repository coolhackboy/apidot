/**
 * GTM (Google Tag Manager) custom event tracking utilities.
 * All events are pushed to window.dataLayer for GTM to pick up.
 */

declare global {
  interface Window {
    dataLayer: Record<string, any>[];
  }
}

/**
 * Safely push an event to the GTM dataLayer.
 */
function pushEvent(eventName: string, eventData?: Record<string, any>): void {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      event: eventName,
      ...eventData,
    });
  }
}

/**
 * Push user data to dataLayer for Enhanced Conversions.
 * Fires on every page load for logged-in users so GTM can
 * associate conversion events with the user's email.
 */
export function pushUserData(email: string): void {
  pushEvent('user_data_ready', {
    user_data: {
      sha256_email_address: email,
    },
  });
}

/**
 * Track new user registration (sign_up).
 * Naturally fires once per user since registration only happens once.
 */
export function trackSignUp(method: 'email' | 'google' | 'google_one_tap' | 'github'): void {
  pushEvent('sign_up', { method });
}

/**
 * Track first-time playground usage (playground_use).
 * Only fires the first time on this device (localStorage guard).
 */
export function trackPlaygroundUse(): void {
  if (typeof window === 'undefined') return;
  const key = 'gtm_playground_used';
  if (!localStorage.getItem(key)) {
    localStorage.setItem(key, '1');
    pushEvent('playground_use');
  }
}

/**
 * Track first-time API key generation (api_key_generated).
 * Only fires the first time on this device (localStorage guard).
 */
export function trackApiKeyGenerated(): void {
  if (typeof window === 'undefined') return;
  const key = 'gtm_api_key_generated';
  if (!localStorage.getItem(key)) {
    localStorage.setItem(key, '1');
    pushEvent('api_key_generated');
  }
}

/**
 * Track a successful purchase/recharge (purchase).
 * Fires every time a payment completes, deduplicated by orderNo
 * to prevent multiple polling callbacks from pushing duplicate events.
 */
const trackedOrders = new Set<string>();

export function trackPurchase(
  orderNo: string,
  value: number,
  currency: string,
  planCode: string,
  planName: string,
  email?: string,
): void {
  if (trackedOrders.has(orderNo)) return;
  trackedOrders.add(orderNo);
  pushEvent('purchase', {
    value,
    currency,
    plan_code: planCode,
    plan_name: planName,
    ...(email && {
      user_data: {
        sha256_email_address: email,
      },
    }),
  });
}
