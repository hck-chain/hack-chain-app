export function resolveIpfs(url: string | null | undefined): string {
  if (!url) return '';
  return url.startsWith('ipfs://')
    ? `https://gateway.pinata.cloud/ipfs/${url.slice('ipfs://'.length)}`
    : url;
}
