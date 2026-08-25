/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Generate a deterministic audit hash from transaction data.
 * Uses a fast FNV-1a-inspired hash for fingerprinting transaction integrity.
 */
export function generateAuditHash(data: {
  amount: number;
  description: string;
  bucketId?: string | null;
  direction: string;
  createdAt: string;
}): string {
  const raw = `${data.amount}|${data.description}|${data.bucketId || ''}|${data.direction}|${data.createdAt}`;
  let hash = 0x811c9dc5; // FNV offset basis
  for (let i = 0; i < raw.length; i++) {
    hash ^= raw.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193); // FNV prime
  }
  // Convert to unsigned 32-bit hex and pad
  return ((hash >>> 0).toString(16)).padStart(8, '0') + ((hash >>> 0 ^ 0xdeadbeef).toString(16)).padStart(8, '0');
}
