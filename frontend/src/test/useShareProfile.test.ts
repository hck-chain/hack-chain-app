import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  buildShareUrl,
  buildShareLinks,
  createQrDataUrl,
  useShareProfile,
} from '@/hooks/useShareProfile';

import { api } from '@/services/api';

vi.mock('@/services/api', () => ({
  api: {
    registerProfileShare: vi.fn(),
  },
}));

const mockedApi = vi.mocked(api);

beforeEach(() => {
  vi.clearAllMocks();
});

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

describe('useShareProfile', () => {
  it('sets the QR status to success when handleQrLoad is called', () => {
    const { result } = renderHook(() =>
      useShareProfile(
        'https://example.com/profile/ada',
        'Ada',
        '0xabc',
      ),
    );

    expect(result.current.qrStatus).toBe('loading');

    act(() => {
      result.current.handleQrLoad();
    });

    expect(result.current.qrStatus).toBe('success');
  });
});

it('sets the QR status to error when handleQrError is called', () => {
  const { result } = renderHook(() =>
    useShareProfile(
      'https://example.com/profile/ada',
      'Ada',
      '0xabc',
    ),
  );

  expect(result.current.qrStatus).toBe('loading');

  act(() => {
    result.current.handleQrError();
  });

  expect(result.current.qrStatus).toBe('error');
});

it('retries the QR by resetting the status and changing the QR URL', () => {
  const { result } = renderHook(() =>
    useShareProfile(
      'https://example.com/profile/ada',
      'Ada',
      '0xabc',
    ),
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

it('registers a profile share when copying the link', () => {
  const { result } = renderHook(() =>
    useShareProfile(
      'https://example.com/profile/ada',
      'Ada',
      '0xabc',
    ),
  );

  act(() => {
    result.current.handleLinkCopy();
  });

  expect(mockedApi.registerProfileShare).toHaveBeenCalledWith('0xabc');
  expect(mockedApi.registerProfileShare).toHaveBeenCalledTimes(1);
});

it('registers a profile share when opening a social link', () => {
  const { result } = renderHook(() =>
    useShareProfile(
      'https://example.com/profile/ada',
      'Ada',
      '0xabc',
    ),
  );

  act(() => {
    result.current.handleSocialClick();
  });

  expect(mockedApi.registerProfileShare).toHaveBeenCalledWith('0xabc');
  expect(mockedApi.registerProfileShare).toHaveBeenCalledTimes(1);
});
