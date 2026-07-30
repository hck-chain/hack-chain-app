import { describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  buildShareUrl,
  buildShareLinks,
  createQrDataUrl,
  useShare,
} from '@/hooks/useShare';

describe('buildShareUrl', () => {
  const profileUrl = 'https://example.com/profile/ada';
  const shareText = "Check out Ada's profile on HackChain";

  it('builds the WhatsApp share URL', () => {
    const url = buildShareUrl('whatsapp', profileUrl, shareText);

    expect(url.startsWith('https://wa.me/?text=')).toBe(true);
    expect(url).toContain(encodeURIComponent(profileUrl));
  });

  it('builds the LinkedIn share URL', () => {
    const url = buildShareUrl('linkedin', profileUrl, shareText);

    expect(
      url.startsWith(
        'https://www.linkedin.com/sharing/share-offsite/?url=',
      ),
    ).toBe(true);

    expect(url).toContain(encodeURIComponent(profileUrl));
  });

  it('builds the Twitter share URL', () => {
    const url = buildShareUrl('twitter', profileUrl, shareText);

    expect(
      url.startsWith('https://twitter.com/intent/tweet?text='),
    ).toBe(true);

    expect(url).toContain(encodeURIComponent(profileUrl));
  });
});

describe('buildShareLinks', () => {
  const shareText = "Check out Ada's profile on HackChain";

  it('returns share links for every supported platform', () => {
    const links = buildShareLinks(
      'https://example.com/profile/ada',
      shareText,
    );

    expect(links.whatsapp).toContain('wa.me');
    expect(links.linkedin).toContain('linkedin.com');
    expect(links.twitter).toContain('twitter.com');
  });

  it('encodes profile URLs containing spaces and query parameters', () => {
    const profileUrl =
      'https://example.com/profile/Ada Lovelace?tab=certificates';

    const links = buildShareLinks(profileUrl, shareText);

    expect(links.whatsapp).toContain(
      encodeURIComponent(profileUrl),
    );

    expect(links.linkedin).toContain(
      encodeURIComponent(profileUrl),
    );

    expect(links.twitter).toContain(
      encodeURIComponent(profileUrl),
    );
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

    expect(url).toContain(
      encodeURIComponent(profileUrl),
    );
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

describe('useShare', () => {
  const defaultProps = {
    url: 'https://example.com/profile/ada',
    displayName: 'Ada',
    shareText: "Check out Ada's profile on HackChain",
  };

  it('sets the QR status to success when handleQrLoad is called', () => {
    const { result } = renderHook(() =>
      useShare(defaultProps),
    );

    expect(result.current.qrStatus).toBe('loading');

    act(() => {
      result.current.handleQrLoad();
    });

    expect(result.current.qrStatus).toBe('success');
  });

  it('sets the QR status to error when handleQrError is called', () => {
    const { result } = renderHook(() =>
      useShare(defaultProps),
    );

    expect(result.current.qrStatus).toBe('loading');

    act(() => {
      result.current.handleQrError();
    });

    expect(result.current.qrStatus).toBe('error');
  });

  it('retries the QR by resetting the status and changing the QR URL', () => {
    const { result } = renderHook(() =>
      useShare(defaultProps),
    );

    const initialQrUrl = result.current.qrUrl;

    act(() => {
      result.current.handleQrError();
    });

    expect(result.current.qrStatus).toBe('error');

    act(() => {
      result.current.retryQr();
    });

    expect(result.current.qrStatus).toBe('loading');
    expect(result.current.qrUrl).not.toBe(initialQrUrl);
  });

  it('calls onShare when copying the link', () => {
    const onShare = vi.fn();

    const { result } = renderHook(() =>
      useShare({
        ...defaultProps,
        onShare,
      }),
    );

    act(() => {
      result.current.handleLinkCopy();
    });

    expect(onShare).toHaveBeenCalledTimes(1);
  });

  it('calls onShare when opening a social link', () => {
    const onShare = vi.fn();

    const { result } = renderHook(() =>
      useShare({
        ...defaultProps,
        onShare,
      }),
    );

    act(() => {
      result.current.handleSocialClick();
    });

    expect(onShare).toHaveBeenCalledTimes(1);
  });

  it('does not throw when onShare is undefined', () => {
    const { result } = renderHook(() =>
      useShare(defaultProps),
    );

    expect(() => {
      act(() => {
        result.current.handleLinkCopy();
        result.current.handleSocialClick();
      });
    }).not.toThrow();
  });
});