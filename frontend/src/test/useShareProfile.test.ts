import { describe, expect, it } from 'vitest';
import {
  buildShareUrl,
  buildShareLinks,
  createQrDataUrl,
} from '@/hooks/useShareProfile';

describe('buildShareUrl', () => {
  const profileUrl = 'https://example.com/profile/ada';
  const displayName = 'Ada';

  it('builds the WhatsApp share URL', () => {
    const url = buildShareUrl('whatsapp', profileUrl, displayName);

    expect(url.startsWith('https://wa.me/?text=')).toBe(true);
    expect(url).toContain(encodeURIComponent(profileUrl));
  });

  it('builds the LinkedIn share URL', () => {
    const url = buildShareUrl('linkedin', profileUrl, displayName);

    expect(url.startsWith('https://www.linkedin.com/sharing/share-offsite/?url=')).toBe(true);
    expect(url).toContain(encodeURIComponent(profileUrl));
  });

  it('builds the Twitter share URL', () => {
    const url = buildShareUrl('twitter', profileUrl, displayName);

    expect(url.startsWith('https://twitter.com/intent/tweet?text=')).toBe(true);
    expect(url).toContain(encodeURIComponent(profileUrl));
  });
});

describe('buildShareLinks', () => {
  it('returns share links for every supported platform', () => {
    const links = buildShareLinks(
      'https://example.com/profile/ada',
      'Ada',
    );

    expect(links.whatsapp).toContain('wa.me');
    expect(links.linkedin).toContain('linkedin.com');
    expect(links.twitter).toContain('twitter.com');
  });

  it('encodes profile URLs containing spaces and query parameters', () => {
    const profileUrl =
      'https://example.com/profile/Ada Lovelace?tab=certificates';

    const links = buildShareLinks(profileUrl, 'Ada Lovelace');

    expect(links.whatsapp).toContain(encodeURIComponent(profileUrl));
    expect(links.linkedin).toContain(encodeURIComponent(profileUrl));
    expect(links.twitter).toContain(encodeURIComponent(profileUrl));
  });
});

describe('createQrDataUrl', () => {
  const profileUrl = 'https://example.com/profile/ada';

  it('returns the same QR URL for the same input', () => {
    const first = createQrDataUrl(profileUrl, 0);
    const second = createQrDataUrl(profileUrl, 0);

    expect(first).toBe(second);
  });

  it('returns a different QR URL when the cache-busting value changes', () => {
    const first = createQrDataUrl(profileUrl, 0);
    const second = createQrDataUrl(profileUrl, 1);

    expect(first).not.toBe(second);
  });

  it('includes the encoded profile URL', () => {
    const url = createQrDataUrl(profileUrl, 0);

    expect(url).toContain(encodeURIComponent(profileUrl));
  });

  it('includes the cache-busting parameter', () => {
    const url = createQrDataUrl(profileUrl, 7);

    expect(url).toContain('&t=7');
  });

  it('includes the QR size parameter', () => {
    const url = createQrDataUrl(profileUrl, 0);

    expect(url).toContain('size=180x180');
  });
});
