import {
  S3ImageCrypto,
  S3ImageCryptoOptions,
  EncryptionMetadata,
} from '../../src/s3/s3-image-crypto';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { KMSClient, GenerateDataKeyCommand, DecryptCommand } from '@aws-sdk/client-kms';
import { Upload } from '@aws-sdk/lib-storage';
import * as crypto from 'crypto';
import { Readable } from 'stream';

// 모킹 설정
jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/client-kms');
jest.mock('@aws-sdk/lib-storage');
jest.mock('crypto');

describe('S3ImageCrypto', () => {
  // 테스트에 사용할 기본 옵션
  const defaultOptions: S3ImageCryptoOptions = {
    region: 'ap-northeast-2',
    bucketName: 'test-bucket',
    kmsKeyId: 'test-key-id',
  };

  // 테스트 이미지 데이터
  const imageBuffer = Buffer.from('테스트 이미지 데이터');
  const s3Key = 'test-folder/image.jpg';

  // 모킹된 객체들
  let mockS3Client: jest.Mocked<S3Client>;
  let mockKmsClient: jest.Mocked<KMSClient>;
  let mockUpload: jest.Mocked<Upload>;

  beforeEach(() => {
    // 모킹 초기화
    jest.clearAllMocks();

    // S3Client 모킹
    mockS3Client = {
      send: jest.fn<Promise<unknown>, [unknown]>().mockResolvedValue({}),
    } as unknown as jest.Mocked<S3Client>;
    (S3Client as unknown as jest.Mock).mockImplementation(() => mockS3Client);

    // KMSClient 모킹
    mockKmsClient = {
      send: jest.fn<Promise<unknown>, [unknown]>().mockResolvedValue({}),
    } as unknown as jest.Mocked<KMSClient>;
    (KMSClient as unknown as jest.Mock).mockImplementation(() => mockKmsClient);

    // Upload 모킹
    mockUpload = {
      done: jest.fn().mockResolvedValue({}),
    } as unknown as jest.Mocked<Upload>;
    (Upload as unknown as jest.Mock).mockImplementation(() => mockUpload);

    // crypto 모듈 모킹
    (crypto.randomBytes as jest.Mock).mockImplementation((size: number) => {
      return Buffer.alloc(size).fill(1);
    });
    (crypto.createCipheriv as jest.Mock).mockImplementation(() => {
      return {
        update: jest.fn().mockReturnValue(Buffer.from('암호화된_데이터')),
        final: jest.fn().mockReturnValue(Buffer.from('')),
      };
    });
    (crypto.createDecipheriv as jest.Mock).mockImplementation(() => {
      return {
        update: jest.fn().mockReturnValue(Buffer.from('복호화된_데이터')),
        final: jest.fn().mockReturnValue(Buffer.from('')),
      };
    });
    (crypto.scryptSync as jest.Mock).mockImplementation(() => {
      return Buffer.alloc(48).fill(2);
    });
  });

  describe('생성자', () => {
    it('옵션으로 인스턴스를 생성합니다', () => {
      const imageCrypto = new S3ImageCrypto(defaultOptions);
      expect(imageCrypto).toBeInstanceOf(S3ImageCrypto);
      expect(S3Client).toHaveBeenCalledWith({
        region: defaultOptions.region,
        credentials: undefined,
      });
      expect(KMSClient).toHaveBeenCalledWith({
        region: defaultOptions.region,
        credentials: undefined,
      });
    });

    it('자격 증명으로 인스턴스를 생성합니다', () => {
      const options: S3ImageCryptoOptions = {
        ...defaultOptions,
        credentials: {
          accessKeyId: 'test-access-key',
          secretAccessKey: 'test-secret-key',
        },
      };

      const imageCrypto = new S3ImageCrypto(options);
      expect(imageCrypto).toBeInstanceOf(S3ImageCrypto);
      expect(S3Client).toHaveBeenCalledWith({
        region: options.region,
        credentials: {
          accessKeyId: 'test-access-key',
          secretAccessKey: 'test-secret-key',
        },
      });
    });
  });

  describe('encryptAndUpload', () => {
    it('이미지를 암호화하여 S3에 업로드합니다', async () => {
      // KMS 응답 모킹
      mockKmsClient.send.mockImplementation(command => {
        if (command instanceof GenerateDataKeyCommand) {
          return {
            Plaintext: Buffer.from('일반_텍스트_키'),
            CiphertextBlob: Buffer.from('암호화된_키'),
            KeyId: 'test-key-id',
          };
        }
        return {};
      });

      const imageCrypto = new S3ImageCrypto(defaultOptions);
      const result = await imageCrypto.encryptAndUpload(imageBuffer, s3Key);

      // 결과 검증
      expect(result).toBe(s3Key);
      const sendMethod = mockKmsClient.send;
      expect(sendMethod).toHaveBeenCalledWith(expect.any(GenerateDataKeyCommand));
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(crypto.createCipheriv).toHaveBeenCalled();
      expect(Upload).toHaveBeenCalledWith(
        expect.objectContaining({
          client: mockS3Client,
          params: expect.objectContaining({
            Bucket: defaultOptions.bucketName,
            Key: s3Key,
            ContentType: 'application/octet-stream',
            Metadata: expect.objectContaining({
              'x-amz-meta-encryption': expect.any(String),
            }),
          }),
        }),
      );
      expect(mockUpload.done).toHaveBeenCalled();
    });

    it('데이터 키 생성 실패 시 오류를 던집니다', async () => {
      // KMS 오류 모킹
      // @ts-expect-error - Jest mock 타입 오류 무시
      mockKmsClient.send.mockRejectedValueOnce(new Error('KMS 키 생성 실패'));

      const imageCrypto = new S3ImageCrypto(defaultOptions);
      await expect(imageCrypto.encryptAndUpload(imageBuffer, s3Key)).rejects.toThrow(
        '암호화 및 업로드 실패: 데이터 키 생성 실패: KMS 키 생성 실패',
      );
    });

    it('업로드 실패 시 오류를 던집니다', async () => {
      // KMS 응답 모킹
      mockKmsClient.send.mockImplementation(command => {
        if (command instanceof GenerateDataKeyCommand) {
          return {
            Plaintext: Buffer.from('일반_텍스트_키'),
            CiphertextBlob: Buffer.from('암호화된_키'),
            KeyId: 'test-key-id',
          };
        }
        return {};
      });

      // 업로드 실패 모킹
      mockUpload.done.mockRejectedValueOnce(new Error('업로드 실패'));

      const imageCrypto = new S3ImageCrypto(defaultOptions);
      await expect(imageCrypto.encryptAndUpload(imageBuffer, s3Key)).rejects.toThrow(
        '암호화 및 업로드 실패: 업로드 실패',
      );
    });
  });

  describe('downloadAndDecrypt', () => {
    it('S3에서 이미지를 다운로드하고 복호화합니다', async () => {
      // S3 응답 모킹
      const mockMetadata: EncryptionMetadata = {
        encryptedDataKey: Buffer.from('암호화된_키').toString('base64'),
        iv: Buffer.from('iv').toString('base64'),
        algorithm: 'aes-256-cbc',
        keyId: 'test-key-id',
      };

      const mockStream = new Readable();
      mockStream.push(Buffer.from('암호화된_데이터'));
      mockStream.push(null);

      mockS3Client.send.mockImplementation(command => {
        if (command instanceof GetObjectCommand) {
          return {
            Body: mockStream,
            Metadata: {
              'x-amz-meta-encryption': JSON.stringify(mockMetadata),
            },
          };
        }
        return {};
      });

      // KMS 응답 모킹
      mockKmsClient.send.mockImplementation(command => {
        if (command instanceof DecryptCommand) {
          return {
            Plaintext: Buffer.from('복호화된_키'),
            KeyId: 'test-key-id',
          };
        }
        return {};
      });

      const imageCrypto = new S3ImageCrypto(defaultOptions);
      const result = await imageCrypto.downloadAndDecrypt(s3Key);

      // 결과 검증
      expect(result).toEqual(expect.any(Buffer));
      expect(mockS3Client.send).toHaveBeenCalledWith(expect.any(GetObjectCommand));
      expect(mockKmsClient.send).toHaveBeenCalledWith(expect.any(DecryptCommand));
      expect(crypto.createDecipheriv).toHaveBeenCalled();
    });

    it('객체가 없을 경우 오류를 던집니다', async () => {
      // @ts-expect-error - Jest mock 타입 오류 무시
      mockS3Client.send.mockResolvedValueOnce({
        Body: undefined,
        Metadata: undefined,
      });

      const imageCrypto = new S3ImageCrypto(defaultOptions);
      await expect(imageCrypto.downloadAndDecrypt(s3Key)).rejects.toThrow(
        '다운로드 및 복호화 실패: S3에서 객체를 찾을 수 없습니다',
      );
    });

    it('암호화되지 않은 이미지도 다운로드합니다', async () => {
      const mockStream = new Readable();
      mockStream.push(Buffer.from('암호화되지_않은_데이터'));
      mockStream.push(null);

      // 메타데이터가 없는 응답을 모킹
      mockS3Client.send.mockImplementation(command => {
        if (command instanceof GetObjectCommand) {
          return {
            Body: mockStream,
            Metadata: {}, // 메타데이터는 있지만 암호화 메타데이터가 없음
          };
        }
        return {};
      });

      const imageCrypto = new S3ImageCrypto(defaultOptions);
      const result = await imageCrypto.downloadAndDecrypt(s3Key);

      // 결과 검증
      expect(result).toEqual(expect.any(Buffer));
      expect(mockS3Client.send).toHaveBeenCalledWith(expect.any(GetObjectCommand));
      expect(mockKmsClient.send).not.toHaveBeenCalled(); // KMS API 호출되지 않아야 함
      expect(crypto.createDecipheriv).not.toHaveBeenCalled(); // 복호화되지 않아야 함
    });

    it('메타데이터 객체가 없는 경우에도 이미지를 다운로드합니다', async () => {
      const mockStream = new Readable();
      mockStream.push(Buffer.from('암호화되지_않은_데이터'));
      mockStream.push(null);

      // 메타데이터 자체가 없는 응답을 모킹
      mockS3Client.send.mockImplementation(command => {
        if (command instanceof GetObjectCommand) {
          return {
            Body: mockStream,
            Metadata: undefined, // 메타데이터 객체 자체가 없음
          };
        }
        return {};
      });

      const imageCrypto = new S3ImageCrypto(defaultOptions);
      const result = await imageCrypto.downloadAndDecrypt(s3Key);

      // 결과 검증
      expect(result).toEqual(expect.any(Buffer));
      expect(mockS3Client.send).toHaveBeenCalledWith(expect.any(GetObjectCommand));
      expect(mockKmsClient.send).not.toHaveBeenCalled(); // KMS API 호출되지 않아야 함
      expect(crypto.createDecipheriv).not.toHaveBeenCalled(); // 복호화되지 않아야 함
    });

    it('데이터 키 복호화 실패 시 오류를 던집니다', async () => {
      // S3 응답 모킹
      const mockMetadata: EncryptionMetadata = {
        encryptedDataKey: Buffer.from('암호화된_키').toString('base64'),
        iv: Buffer.from('iv').toString('base64'),
        algorithm: 'aes-256-cbc',
        keyId: 'test-key-id',
      };

      const mockStream = new Readable();
      mockStream.push(Buffer.from('암호화된_데이터'));
      mockStream.push(null);

      // @ts-expect-error - Jest mock 타입 오류 무시
      mockS3Client.send.mockResolvedValueOnce({
        Body: mockStream,
        Metadata: {
          'x-amz-meta-encryption': JSON.stringify(mockMetadata),
        },
      });

      // KMS 오류 모킹
      // @ts-expect-error - Jest mock 타입 오류 무시
      mockKmsClient.send.mockRejectedValueOnce(new Error('KMS 복호화 실패'));

      const imageCrypto = new S3ImageCrypto(defaultOptions);

      try {
        await imageCrypto.downloadAndDecrypt(s3Key);
        fail('오류가 발생해야 합니다');
      } catch (error) {
        expect((error as Error).message).toContain('데이터 키 복호화 실패: KMS 복호화 실패');
      }
    });
  });

  describe('유틸리티 메서드', () => {
    it('getS3Client는 S3 클라이언트를 반환합니다', () => {
      const imageCrypto = new S3ImageCrypto(defaultOptions);
      expect(imageCrypto.getS3Client()).toBe(mockS3Client);
    });

    it('getKmsClient는 KMS 클라이언트를 반환합니다', () => {
      const imageCrypto = new S3ImageCrypto(defaultOptions);
      expect(imageCrypto.getKmsClient()).toBe(mockKmsClient);
    });
  });
});
