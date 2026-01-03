/**
 * Async utilities for robust operation handling
 * Provides timeout wrappers and abort controllers to prevent hanging operations
 */

/**
 * Error thrown when an operation times out
 */
export class TimeoutError extends Error {
  constructor(message: string = 'Operation timed out') {
    super(message);
    this.name = 'TimeoutError';
  }
}

/**
 * Wraps a promise with a timeout. If the promise doesn't resolve within
 * the specified time, rejects with a TimeoutError.
 * 
 * @param promise - The promise to wrap
 * @param timeoutMs - Maximum time to wait in milliseconds
 * @param errorMessage - Optional custom error message
 * @returns The result of the promise if it resolves in time
 * @throws TimeoutError if the operation times out
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage?: string
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout>;
  
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new TimeoutError(errorMessage || `Operation timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId!);
    return result;
  } catch (error) {
    clearTimeout(timeoutId!);
    throw error;
  }
}

/**
 * Creates an abortable operation controller.
 * Use the signal with fetch/Supabase operations,
 * and call abort() to cancel pending operations.
 */
export function createAbortableOperation(): {
  signal: AbortSignal;
  abort: () => void;
  isAborted: () => boolean;
} {
  const controller = new AbortController();
  
  return {
    signal: controller.signal,
    abort: () => controller.abort(),
    isAborted: () => controller.signal.aborted,
  };
}

/**
 * Progress states for multi-step operations
 */
export type OperationProgress = 
  | 'idle'
  | 'connecting'
  | 'creating'
  | 'adding-details'
  | 'finalizing'
  | 'complete'
  | 'error';

/**
 * Human-readable progress messages
 */
export const progressMessages: Record<OperationProgress, string> = {
  idle: '',
  connecting: 'Connecting...',
  creating: 'Creating event...',
  'adding-details': 'Adding details...',
  finalizing: 'Finalizing...',
  complete: 'Done!',
  error: 'Something went wrong',
};

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  shouldRetry?: (error: unknown) => boolean;
}

/**
 * Default retry configuration - fast fail
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 2,
  baseDelayMs: 1000,
  maxDelayMs: 5000,
  shouldRetry: (error: unknown) => {
    // Only retry on network/transient errors
    if (error instanceof TimeoutError) return true;
    if (error instanceof Error) {
      const msg = error.message.toLowerCase();
      return (
        msg.includes('network') ||
        msg.includes('fetch failed') ||
        msg.includes('schema cache') ||
        msg.includes('connection')
      );
    }
    return false;
  },
};

/**
 * Add jitter to delay to prevent thundering herd
 */
export function addJitter(delay: number, jitterFactor: number = 0.3): number {
  const jitter = delay * jitterFactor * (Math.random() * 2 - 1);
  return Math.max(0, delay + jitter);
}

/**
 * Execute an operation with retry logic and timeout
 * 
 * @param operation - Async function to execute
 * @param config - Retry configuration
 * @param timeoutMs - Timeout per attempt in milliseconds
 * @returns Result of the operation
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
  timeoutMs: number = 10000
): Promise<T> {
  let lastError: unknown;
  
  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      // Wrap each attempt with timeout
      return await withTimeout(operation(), timeoutMs, 'Request timed out');
    } catch (error) {
      lastError = error;
      
      // Check if we should retry
      const shouldRetry = config.shouldRetry?.(error) ?? false;
      const hasMoreRetries = attempt < config.maxRetries;
      
      if (!shouldRetry || !hasMoreRetries) {
        throw error;
      }
      
      // Calculate delay with exponential backoff and jitter
      const exponentialDelay = config.baseDelayMs * Math.pow(2, attempt);
      const cappedDelay = Math.min(exponentialDelay, config.maxDelayMs);
      const delay = addJitter(cappedDelay);
      
      console.warn(
        `[withRetry] Attempt ${attempt + 1}/${config.maxRetries + 1} failed, ` +
        `retrying in ${Math.round(delay)}ms...`,
        error instanceof Error ? error.message : error
      );
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

