/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Enforce 2MB Maximum File Size Limit across the platform
 */
export const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

export function validateImageFileSize(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File "${file.name}" exceeds the 2MB size limit (${(file.size / (1024 * 1024)).toFixed(1)}MB). Please upload an image smaller than 2MB.`
    };
  }
  return { valid: true };
}
