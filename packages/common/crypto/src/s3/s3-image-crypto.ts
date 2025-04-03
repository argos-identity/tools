import { Upload } from '@aws-sdk/lib-storage';
import { S3Client, GetObjectCommand, GetObjectCommandOutput } from '@aws-sdk/client-s3';
import {
  KMSClient,
  GenerateDataKeyCommand,
  DecryptCommand,
  GenerateDataKeyCommandOutput,
  DecryptCommandOutput,
} from '@aws-sdk/client-kms';
import * as crypto from 'crypto';
import { Readable } from 'stream';

/**
 * S3ImageCrypto 클래스 설정 옵션
 */
export interface S3ImageCryptoOptions {
  /** AWS 지역 */
  region: string;
  /** S3 버킷 이름 */
  bucketName: string;
  /** KMS 키 ID 또는 ARN */
  kmsKeyId: string;
  /** 암호화 알고리즘 (기본값: aes-256-cbc) */
  algorithm?: string;
  /** AWS 자격 증명 (선택 사항, AWS SDK 기본 자격 증명 체인 사용) */
  credentials?: {
    accessKeyId: string;
    secretAccessKey: string;
  };
}

/**
 * S3 암호화 메타데이터 인터페이스
 */
export interface EncryptionMetadata {
  /** 암호화된 데이터 키 (base64 인코딩) */
  encryptedDataKey: string;
  /** 초기화 벡터 (base64 인코딩) */
  iv: string;
  /** 암호화 알고리즘 */
  algorithm: string;
  /** 키 ID 또는 ARN */
  keyId: string;
}

/**
 * S3 이미지 암복호화 클래스 (KMS 사용)
 */
export class S3ImageCrypto {
  private s3Client: S3Client;
  private kmsClient: KMSClient;
  private bucketName: string;
  private algorithm: string;
  private kmsKeyId: string;

  /**
   * S3ImageCrypto 클래스 생성자
   * @param options S3ImageCrypto 설정 옵션
   */
  constructor(options: S3ImageCryptoOptions) {
    const { region, bucketName, kmsKeyId, algorithm = 'aes-256-cbc', credentials } = options;

    this.bucketName = bucketName;
    this.algorithm = algorithm;
    this.kmsKeyId = kmsKeyId;

    const awsCredentials = credentials
      ? {
          accessKeyId: credentials.accessKeyId,
          secretAccessKey: credentials.secretAccessKey,
        }
      : undefined;

    // S3 클라이언트 초기화
    this.s3Client = new S3Client({
      region,
      credentials: awsCredentials,
    });

    // KMS 클라이언트 초기화
    this.kmsClient = new KMSClient({
      region,
      credentials: awsCredentials,
    });
  }

  /**
   * KMS에서 데이터 키 생성
   * @returns 데이터 키(암호화 키로 사용)와 암호화된 데이터 키
   */
  private async generateDataKey(): Promise<{
    dataKey: Buffer;
    encryptedDataKey: Buffer;
    keyId: string;
  }> {
    try {
      const response: GenerateDataKeyCommandOutput = await this.kmsClient.send(
        new GenerateDataKeyCommand({
          KeyId: this.kmsKeyId,
          KeySpec: 'AES_256', // 256비트 AES 키 요청
        }),
      );

      if (!response.Plaintext || !response.CiphertextBlob || !response.KeyId) {
        throw new Error('KMS에서 데이터 키를 생성하지 못했습니다');
      }

      return {
        dataKey: Buffer.from(response.Plaintext),
        encryptedDataKey: Buffer.from(response.CiphertextBlob),
        keyId: response.KeyId,
      };
    } catch (error) {
      throw new Error(
        `데이터 키 생성 실패: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * KMS로 암호화된 데이터 키 복호화
   * @param encryptedDataKey 암호화된 데이터 키
   * @returns 복호화된 데이터 키
   */
  private async decryptDataKey(encryptedDataKey: Buffer): Promise<Buffer> {
    try {
      const response: DecryptCommandOutput = await this.kmsClient.send(
        new DecryptCommand({
          CiphertextBlob: encryptedDataKey,
          KeyId: this.kmsKeyId,
        }),
      );

      if (!response.Plaintext) {
        throw new Error('KMS에서 데이터 키를 복호화하지 못했습니다');
      }

      return Buffer.from(response.Plaintext);
    } catch (error) {
      throw new Error(
        `데이터 키 복호화 실패: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * 이미지 버퍼 암호화
   * @param imageBuffer 원본 이미지 버퍼
   * @returns 암호화된 이미지 데이터와 메타데이터
   */
  private async encryptImage(imageBuffer: Buffer): Promise<{
    encryptedData: Buffer;
    metadata: EncryptionMetadata;
  }> {
    // KMS에서 데이터 키 생성
    const { dataKey, encryptedDataKey, keyId } = await this.generateDataKey();

    // 초기화 벡터(IV) 생성
    const iv = crypto.randomBytes(16);

    // 암호화
    const cipher = crypto.createCipheriv(this.algorithm, dataKey, iv);
    const encryptedData = Buffer.concat([cipher.update(imageBuffer), cipher.final()]);

    // 메타데이터 생성
    const metadata: EncryptionMetadata = {
      encryptedDataKey: encryptedDataKey.toString('base64'),
      iv: iv.toString('base64'),
      algorithm: this.algorithm,
      keyId: keyId,
    };

    return {
      encryptedData,
      metadata,
    };
  }

  /**
   * 암호화된 이미지 복호화
   * @param encryptedData 암호화된 이미지 데이터
   * @param metadata 암호화 메타데이터
   * @returns 복호화된 이미지 버퍼
   */
  private async decryptImage(encryptedData: Buffer, metadata: EncryptionMetadata): Promise<Buffer> {
    const { encryptedDataKey, iv, algorithm } = metadata;

    // 암호화된 데이터 키 디코딩
    const encryptedDataKeyBuffer = Buffer.from(encryptedDataKey, 'base64');

    // KMS로 데이터 키 복호화
    const dataKey = await this.decryptDataKey(encryptedDataKeyBuffer);

    // IV 디코딩
    const ivBuffer = Buffer.from(iv, 'base64');

    // 이미지 데이터 복호화
    const decipher = crypto.createDecipheriv(algorithm, dataKey, ivBuffer);
    return Buffer.concat([decipher.update(encryptedData), decipher.final()]);
  }

  /**
   * 스트림을 버퍼로 변환
   * @param stream 읽기 가능한 스트림
   * @returns 버퍼
   */
  private async streamToBuffer(stream: Readable): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];

      stream.on('data', (chunk: Buffer) => chunks.push(Buffer.from(chunk)));
      stream.on('error', err => reject(err));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }

  /**
   * 이미지를 암호화하여 S3에 업로드
   * @param imageBuffer 원본 이미지 버퍼
   * @param s3Key S3에 저장될 객체 키(경로)
   * @returns 업로드된 S3 객체 키
   */
  async encryptAndUpload(imageBuffer: Buffer, s3Key: string): Promise<string> {
    try {
      // 이미지 암호화
      const { encryptedData, metadata } = await this.encryptImage(imageBuffer);

      // 메타데이터를 JSON으로 변환
      const metadataJson = JSON.stringify(metadata);

      // S3에 업로드
      const upload = new Upload({
        client: this.s3Client,
        params: {
          Bucket: this.bucketName,
          Key: s3Key,
          Body: encryptedData,
          ContentType: 'application/octet-stream', // 암호화된 데이터
          Metadata: {
            'x-amz-meta-encryption': metadataJson,
          },
        },
      });

      await upload.done();
      return s3Key;
    } catch (error) {
      throw new Error(
        `암호화 및 업로드 실패: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * S3에서 이미지를 다운로드 후 필요시 복호화
   * @param s3Key S3 객체 키(경로)
   * @returns 이미지 버퍼 (암호화된 경우 복호화됨)
   */
  async downloadAndDecrypt(s3Key: string): Promise<Buffer> {
    try {
      // S3에서 객체 다운로드
      const response: GetObjectCommandOutput = await this.s3Client.send(
        new GetObjectCommand({
          Bucket: this.bucketName,
          Key: s3Key,
        }),
      );

      if (!response.Body) {
        throw new Error('S3에서 객체를 찾을 수 없습니다');
      }

      // 스트림을 버퍼로 변환
      const data = await this.streamToBuffer(response.Body as Readable);

      // 메타데이터가 없거나 암호화 메타데이터가 없으면 암호화되지 않은 파일로 판단
      if (!response.Metadata || !response.Metadata['x-amz-meta-encryption']) {
        return data;
      }

      // 메타데이터 파싱
      const metadata = JSON.parse(
        String(response.Metadata['x-amz-meta-encryption']),
      ) as EncryptionMetadata;

      // 이미지 복호화
      return this.decryptImage(data, metadata);
    } catch (error) {
      throw new Error(
        `다운로드 및 복호화 실패: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * S3 클라이언트 인스턴스 반환
   * @returns S3 클라이언트 인스턴스
   */
  getS3Client(): S3Client {
    return this.s3Client;
  }

  /**
   * KMS 클라이언트 인스턴스 반환
   * @returns KMS 클라이언트 인스턴스
   */
  getKmsClient(): KMSClient {
    return this.kmsClient;
  }
}
