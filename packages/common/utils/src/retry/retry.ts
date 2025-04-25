/**
 * 비동기 작업을 지정된 횟수만큼 재시도하는 유틸리티 함수
 */

export interface RetryOptions<T> {
  /**
   * 최대 재시도 횟수 (기본값: 5)
   * 첫 시도를 제외한 추가 시도 횟수입니다.
   * 즉, maxRetries가 5이면 총 6번 시도합니다(최초 1번 + 재시도 5번).
   */
  maxRetries?: number;

  /**
   * 재시도 간 지연 시간(밀리초) (기본값: 200)
   */
  delayMs?: number;

  /**
   * 지수 백오프 사용 여부 (기본값: true)
   * true인 경우 재시도할 때마다 지연 시간이 2배씩 증가합니다.
   */
  exponentialBackoff?: boolean;

  /**
   * 결과를 평가하여 재시도 여부를 결정하는 함수 (선택 사항)
   * true를 반환하면 현재 결과가 성공으로 간주되어 즉시 반환됩니다.
   * false를 반환하면 최대 재시도 횟수에 도달하지 않은 경우 재시도합니다.
   * 지정하지 않으면 오류가 발생하지 않는 한 모든 결과를 성공으로 간주합니다.
   */
  isSuccess?: (result: T) => boolean;

  /**
   * 재시도 전 호출되는 콜백 함수 (선택 사항)
   * 다음 재시도 횟수와 발생한 에러(있는 경우)를 파라미터로 받습니다.
   * 에러가 발생하지 않았으나 isSuccess가 false를 반환한 경우 error는 undefined입니다.
   */
  onRetry?: (retryCount: number, error: Error | undefined) => void;

  /**
   * 특정 오류에 대해 재시도를 건너뛰고 즉시 실패하도록 지정하는 함수 (선택 사항)
   * true를 반환하면 재시도를 중단하고 해당 오류를 즉시 throw합니다.
   */
  shouldAbort?: (error: Error) => boolean;
}

/**
 * 오류를 표준 Error 객체로 정규화합니다.
 */
const normalizeError = (error: unknown): Error => {
  return error instanceof Error ? error : new Error(String(error));
};

/**
 * 재시도 지연 시간을 계산합니다.
 */
const calculateDelay = (
  baseDelay: number,
  attemptCount: number,
  useExponential: boolean,
): number => {
  return useExponential ? baseDelay * Math.pow(2, attemptCount) : baseDelay;
};

/**
 * 지정된 비동기 함수를 재시도하는 함수
 *
 * @param fn - 재시도할 비동기 함수
 * @param options - 재시도 옵션
 * @returns 비동기 함수의 성공 결과 또는 마지막 시도의 결과
 * @throws 모든 재시도가 실패하거나 shouldAbort가 true를 반환한 경우 해당 에러를 throw합니다.
 *
 * @example
 * ```typescript
 * // 요청이 성공할 때까지 재시도
 * const result = await retry(async () => {
 *   const response = await fetch('https://api.example.com/data');
 *   if (!response.ok) {
 *     throw new Error(`HTTP error! status: ${response.status}`);
 *   }
 *   return response.json();
 * }, { maxRetries: 5, delayMs: 500 });
 *
 * // 특정 조건(status가 "completed")이 만족될 때까지 재시도
 * const result = await retry(async () => {
 *   return await checkJobStatus(jobId);
 * }, {
 *   maxRetries: 4,
 *   delayMs: 500,
 *   isSuccess: (result) => result.status === "completed"
 * });
 * ```
 */
export async function retry<T>(fn: () => Promise<T>, options: RetryOptions<T> = {}): Promise<T> {
  const {
    maxRetries = 5,
    delayMs = 200,
    exponentialBackoff = true,
    isSuccess,
    onRetry,
    shouldAbort,
  } = options;

  let finalError: Error | undefined;
  let finalResult: T | undefined;

  for (let attemptCount = 0; attemptCount <= maxRetries; attemptCount++) {
    try {
      const result = await fn();
      finalResult = result;

      if (!isSuccess || isSuccess(result)) {
        return result;
      }

      if (attemptCount >= maxRetries) {
        return result;
      }

      if (onRetry) {
        onRetry(attemptCount + 1, undefined);
      }
    } catch (error) {
      finalError = normalizeError(error);

      if (shouldAbort && shouldAbort(finalError)) {
        throw finalError;
      }

      if (attemptCount >= maxRetries) {
        throw finalError;
      }

      if (onRetry) {
        onRetry(attemptCount + 1, finalError);
      }
    }
    const delay = calculateDelay(delayMs, attemptCount, exponentialBackoff);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  if (finalError) {
    throw finalError;
  }
  if (finalResult === undefined) {
    throw new Error('Unexpected: No result or error after retry attempts');
  }
  return finalResult;
}
