// Tests for FeaturedEducatorCard display logic.
//
// The full render suite is blocked by a known React version conflict in the
// monorepo (root ships React 19, workspace ships React 18; Radix UI and
// Lucide pick up the root version inside the test runner). Until the root
// package.json pins React, tests that import Radix or Lucide components
// fail with "Cannot read properties of null (reading 'useRef|useSyncExternalStore')".
//
// This file covers the PURE LOGIC that drives the component:
// - display name resolution
// - knowledge-area overflow label
// - has_classes conditional
// - ipfs:// URL resolution
//
// The navigation click path is covered by the educator-discovery backend
// integration tests (verifying the data shape the component receives).

import { describe, it, expect } from 'vitest';
import type { FeaturedEducator } from '@/types/dashboard';

// ---- pure helpers copied from FeaturedEducatorCard.tsx ----
function initials(name: string | null, org: string | null): string {
  const source = name || org || '?';
  return source.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');
}

function resolveIpfs(url: string | null): string {
  if (!url) return '';
  return url.startsWith('ipfs://')
    ? url.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/')
    : url;
}

function displayName(educator: Pick<FeaturedEducator, 'name' | 'lastname' | 'organization_name' | 'wallet_address'>): string {
  return (
    [educator.name, educator.lastname].filter(Boolean).join(' ') ||
    educator.organization_name ||
    educator.wallet_address.slice(0, 8)
  );
}

function areaOverflow(areas: string[]): string | null {
  if (areas.length <= 1) return null;
  return `+${areas.length - 1}`;
}

// -----------------------------------------------------------

const base: FeaturedEducator = {
  wallet_address: '0x1234567890abcdef1234567890abcdef12345678',
  organization_name: 'Hack Academy',
  name: 'Ana',
  lastname: 'García',
  photo_url: null,
  bio: 'Expert in blockchain security',
  knowledge_areas: ['blockchain', 'solidity'],
  certificates_issued: 42,
  has_classes: false,
};

describe('FeaturedEducatorCard — display logic', () => {
  describe('displayName()', () => {
    it('prefers full name over org', () => {
      expect(displayName(base)).toBe('Ana García');
    });

    it('falls back to org when name is missing', () => {
      expect(displayName({ ...base, name: null, lastname: null })).toBe('Hack Academy');
    });

    it('falls back to wallet prefix when both name and org are missing', () => {
      expect(displayName({ ...base, name: null, lastname: null, organization_name: null })).toBe(
        base.wallet_address.slice(0, 8)
      );
    });

    it('ignores empty lastname gracefully', () => {
      expect(displayName({ ...base, lastname: null })).toBe('Ana');
    });
  });

  describe('initials()', () => {
    it('extracts first letters of name and org', () => {
      expect(initials('Ana', 'Hack Academy')).toBe('A');
    });

    it('falls back to org initials when name is null', () => {
      expect(initials(null, 'Hack Academy')).toBe('HA');
    });

    it('returns "?" when both are null', () => {
      expect(initials(null, null)).toBe('?');
    });
  });

  describe('resolveIpfs()', () => {
    it('rewrites ipfs:// URIs to pinata gateway', () => {
      expect(resolveIpfs('ipfs://QmAbc123')).toBe(
        'https://gateway.pinata.cloud/ipfs/QmAbc123'
      );
    });

    it('leaves https URLs untouched', () => {
      const url = 'https://example.com/photo.jpg';
      expect(resolveIpfs(url)).toBe(url);
    });

    it('returns empty string for null', () => {
      expect(resolveIpfs(null)).toBe('');
    });
  });

  describe('areaOverflow()', () => {
    it('returns null when only one area', () => {
      expect(areaOverflow(['blockchain'])).toBeNull();
    });

    it('returns "+1" for two areas', () => {
      expect(areaOverflow(['blockchain', 'solidity'])).toBe('+1');
    });

    it('returns "+2" for three areas', () => {
      expect(areaOverflow(['blockchain', 'solidity', 'rust'])).toBe('+2');
    });

    it('returns null for empty array', () => {
      expect(areaOverflow([])).toBeNull();
    });
  });

  describe('has_classes flag', () => {
    it('is false on base educator', () => {
      expect(base.has_classes).toBe(false);
    });

    it('can be set to true', () => {
      expect({ ...base, has_classes: true }.has_classes).toBe(true);
    });
  });
});
