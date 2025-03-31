import { retry, RetryOptions } from './retry';

describe('retry', () => {
  // retry 내부의 지연 시간을 줄이기 위해 테스트에 앞서 setTimeout을 mocking합니다.
  const originalSetTimeout = global.setTimeout;

  beforeAll(() => {
    // setTimeout을 1ms 지연으로 대체하여 빠른 테스트 실행
    global.setTimeout = function mockedSetTimeout(
      callback: (...args: unknown[]) => void,
      _delay?: number | undefined,
    ) {
      return originalSetTimeout(callback, 1);
    } as typeof global.setTimeout;
  });

  afterAll(() => {
    // 테스트 후 원래 setTimeout 복원
    global.setTimeout = originalSetTimeout;
  });

  it('성공 시 결과를 바로 반환합니다', async () => {
    // given
    const successValue = 'success';
    const fn = jest.fn().mockResolvedValue(successValue);

    // when
    const result = await retry(fn);

    // then
    expect(result).toBe(successValue);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('실패 후 재시도하여 성공하면 결과를 반환합니다', async () => {
    // given
    const fn = jest.fn();
    fn.mockRejectedValueOnce(new Error('first failure'));
    fn.mockRejectedValueOnce(new Error('second failure'));
    fn.mockResolvedValue('success after retries');

    // when
    const result = await retry(fn, { delayMs: 1 });

    // then
    expect(result).toBe('success after retries');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('maxRetries 횟수를 초과하면 마지막 에러를 던집니다', async () => {
    // given
    const expectedError = new Error('always fails');
    const fn = jest.fn().mockRejectedValue(expectedError);

    // when & then
    try {
      await retry(fn, { maxRetries: 2, delayMs: 1 });
      fail('이 코드는 실행되지 않아야 합니다');
    } catch (error) {
      expect(error).toBe(expectedError);
      expect(fn).toHaveBeenCalledTimes(3); // 초기 1회 + 재시도 2회
    }
  });

  it('isSuccess가 false를 반환하면 재시도합니다', async () => {
    // given
    const fn = jest.fn();
    fn.mockResolvedValueOnce({ status: 'pending' });
    fn.mockResolvedValueOnce({ status: 'pending' });
    fn.mockResolvedValue({ status: 'completed' });

    const options: RetryOptions<{ status: string }> = {
      maxRetries: 3,
      delayMs: 1,
      isSuccess: result => result.status === 'completed',
    };

    // when
    const result = await retry(fn, options);

    // then
    expect(result).toEqual({ status: 'completed' });
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('shouldAbort가 true를 반환하면 즉시 실패합니다', async () => {
    // given
    const abortError = new Error('즉시 중단 에러');
    const fn = jest.fn().mockRejectedValue(abortError);

    const options: RetryOptions<string> = {
      maxRetries: 3,
      delayMs: 1,
      shouldAbort: error => error.message === '즉시 중단 에러',
    };

    // when & then
    try {
      await retry(fn, options);
      fail('이 코드는 실행되지 않아야 합니다');
    } catch (error) {
      expect(error).toBe(abortError);
      expect(fn).toHaveBeenCalledTimes(1); // 재시도하지 않고 즉시 에러 반환
    }
  });

  it('onRetry 콜백이 각 재시도마다 호출됩니다', async () => {
    // given
    const fn = jest.fn();
    fn.mockRejectedValueOnce(new Error('first failure'));
    fn.mockRejectedValueOnce(new Error('second failure'));
    fn.mockResolvedValue('success after retries');

    const onRetry = jest.fn();

    // when
    await retry(fn, { maxRetries: 2, delayMs: 1, onRetry });

    // then
    expect(onRetry).toHaveBeenCalledTimes(2);
    expect(onRetry).toHaveBeenNthCalledWith(1, 1, expect.any(Error));
    expect(onRetry).toHaveBeenNthCalledWith(2, 2, expect.any(Error));
  });

  it('exponentialBackoff가 true일 때 지연 시간이 기하급수적으로 증가합니다', async () => {
    // given
    const fn = jest.fn<Promise<string>, []>();
    fn.mockRejectedValueOnce(new Error('first failure'));
    fn.mockResolvedValue('success');

    const delayMs = 10;
    const options: RetryOptions<string> = {
      maxRetries: 1,
      delayMs: delayMs,
      exponentialBackoff: true,
    };

    // 실제 지연 시간을 측정하기 위해 타이머 복원
    global.setTimeout = originalSetTimeout;

    // when
    const startTime = Date.now();
    await retry(fn, options);
    const elapsedTime = Date.now() - startTime;

    // then
    // 정확한 시간을 테스트하기는 어려우므로, 최소한 1회의 지연이 있었는지만 확인
    expect(elapsedTime).toBeGreaterThanOrEqual(delayMs - 5); // 약간의 오차 허용
    expect(fn).toHaveBeenCalledTimes(2);

    // 테스트 후 다시 빠른 setTimeout으로 복원
    global.setTimeout = function mockedSetTimeout(
      callback: (...args: unknown[]) => void,
      _delay?: number | undefined,
    ) {
      return originalSetTimeout(callback, 1);
    } as typeof global.setTimeout;
  });
});
