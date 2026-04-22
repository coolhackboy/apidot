/**
 * Facebook Pixel event tracking utilities.
 * Events are sent via the fbq() function loaded by the FacebookPixel component.
 */

declare global {
  interface Window {
    fbq: (...args: any[]) => void;
  }
}

/**
 * Track CompleteRegistration event (frontend-only, no CAPI deduplication).
 */
export function fbTrackCompleteRegistration(method: string): void {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'CompleteRegistration', { method });
  }
}

/**
 * Track Purchase event.
 * eventId should match the backend CAPI event_id for deduplication.
 * Use 'ORDER_' + orderNo as the eventId.
 */
export function fbTrackPurchase(value: number, currency: string, eventId: string): void {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'Purchase', { value, currency, content_type: 'product' }, { eventID: eventId });
  }
}
