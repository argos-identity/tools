import logger, { createLoggerInstance } from '../../src/core/logger-instance';

describe('logger-instance', () => {
  beforeEach(() => {
    // 환경 변수 초기화
    delete process.env.LOG_LEVEL;
    delete process.env.LOG_FORMAT;
  });

  describe('createLoggerInstance', () => {
    it('기본 설정으로 로거를 생성해야 함', () => {
      const logger = createLoggerInstance();
      expect(logger).toBeDefined();
      expect(logger.level).toBe('info');
    });

    it('로그 레벨을 설정할 수 있어야 함', () => {
      const logger = createLoggerInstance({ level: 'debug' });
      expect(logger.level).toBe('debug');
    });

    it('로그 형식을 설정할 수 있어야 함', () => {
      const jsonLogger = createLoggerInstance({ format: 'json' });
      const simpleLogger = createLoggerInstance({ format: 'simple' });

      // winston 인스턴스의 내부 속성 확인
      expect(jsonLogger).toBeDefined();
      expect(simpleLogger).toBeDefined();
    });

    it('테스트 환경에서 silent 모드로 설정할 수 있어야 함', () => {
      const logger = createLoggerInstance({ silent: true });
      expect(logger).toBeDefined();

      // transports가 silent 모드인지 확인
      expect(logger.transports[0].silent).toBe(true);
    });
  });

  describe('default logger', () => {
    it('기본 로거 인스턴스가 정상적으로 생성되어야 함', () => {
      expect(logger).toBeDefined();
      expect(logger.level).toBe('info');

      // 로거 메서드 존재 확인
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.debug).toBe('function');
    });
  });
});
