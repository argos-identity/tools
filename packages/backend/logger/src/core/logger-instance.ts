import { createLogger, format, transports, Logger } from 'winston';

/**
 * 로거 설정 인터페이스
 */
interface LoggerConfig {
  level?: string;
  format?: 'json' | 'simple';
  silent?: boolean;
}

/**
 * 로거 인스턴스를 생성하는 팩토리 함수
 * @param config 로거 설정
 * @returns 구성된 로거 인스턴스
 */
export const createLoggerInstance = (config: LoggerConfig = {}): Logger => {
  const level = config?.level || 'info';
  const logFormat = config?.format || 'json';

  let selectedFormat;

  if (logFormat === 'simple') {
    // 간단한 텍스트 형식 (개발 환경에 적합)
    selectedFormat = format.combine(
      format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      format.colorize(),
      format.printf(info => {
        const { timestamp, level, message, ...rest } = info;
        return `${timestamp} ${level}: ${message} ${Object.keys(rest).length ? JSON.stringify(rest, null, 2) : ''}`;
      }),
    );
  } else {
    // JSON 형식 (프로덕션 환경에 적합)
    selectedFormat = format.combine(
      format.timestamp(),
      format.errors({ stack: true }),
      format.json(),
    );
  }

  return createLogger({
    level,
    format: selectedFormat,
    transports: [
      new transports.Console({
        silent: config?.silent,
      }),
    ],
  });
};

const logger = createLoggerInstance();

export default logger;
