/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export class AppError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public field?: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'User authentication failed or session expired') {
    super(message, 'AUTH_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class SyncError extends AppError {
  constructor(message: string, public table?: string) {
    super(message, 'SYNC_ERROR');
    this.name = 'SyncError';
  }
}

export class StorageQuotaError extends AppError {
  constructor(message: string = 'Browser local storage quota exceeded') {
    super(message, 'STORAGE_QUOTA_ERROR');
    this.name = 'StorageQuotaError';
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, public query?: string) {
    super(message, 'DATABASE_ERROR');
    this.name = 'DatabaseError';
  }
}

export class NetworkTimeoutError extends AppError {
  constructor(message: string = 'Network request timed out', public timeoutMs?: number) {
    super(message, 'NETWORK_TIMEOUT_ERROR');
    this.name = 'NetworkTimeoutError';
  }
}
