import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { env } from '../config/env'

// MinIO/S3 istemcisini ortam degiskenlerine gore yapilandirir
const s3Client = new S3Client({
  endpoint: env.S3_ENDPOINT,
  region: env.S3_REGION,
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY,
    secretAccessKey: env.S3_SECRET_KEY,
  },
  forcePathStyle: true,
})

// Hata nesnesinin baglanti/kaynak ulasilamazligi olup olmadigini kontrol eder
function isConnectionError(error: unknown): boolean {
  return (
    error instanceof Error &&
    ('code' in error
      ? error.code === 'ECONNREFUSED' || error.code === 'NetworkingError'
      : error.message.includes('ECONNREFUSED'))
  )
}

// Uygulama baslangicinda MinIO baglantisi ve bucket varligini garanti eder
export async function ensureStorageBucket(maxAttempts = 15, delayMs = 2000): Promise<void> {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await s3Client.send(new HeadBucketCommand({ Bucket: env.S3_BUCKET }))
      return
    } catch (error) {
      if (!isConnectionError(error)) {
        try {
          await s3Client.send(new CreateBucketCommand({ Bucket: env.S3_BUCKET }))
          return
        } catch (createError) {
          if (!isConnectionError(createError)) {
            throw createError
          }
        }
      }

      if (attempt === maxAttempts) {
        throw new Error(
          `MinIO/S3 baglantisi kurulamadi (${env.S3_ENDPOINT}). ` +
            'Once "docker compose up -d" calistir, MinIO hazir olunca API otomatik devam eder.',
        )
      }

      console.warn(`MinIO bekleniyor (${attempt}/${maxAttempts})... ${env.S3_ENDPOINT}`)
      await Bun.sleep(delayMs)
    }
  }
}

// Dosyayi S3/MinIO bucket'ina yukler
export async function uploadObject(
  objectKey: string,
  body: Uint8Array,
  contentType: string,
): Promise<void> {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: objectKey,
      Body: body,
      ContentType: contentType,
    }),
  )
}

// Tek bir nesneyi bucket'tan siler
export async function deleteObject(objectKey: string): Promise<void> {
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: objectKey,
    }),
  )
}

// Proxy endpoint icin nesne icerigini dondurur
export async function getObjectBytes(objectKey: string): Promise<{
  body: Uint8Array
  contentType: string
} | null> {
  try {
    const response = await s3Client.send(
      new GetObjectCommand({
        Bucket: env.S3_BUCKET,
        Key: objectKey,
      }),
    )

    if (!response.Body) {
      return null
    }

    return {
      body: await response.Body.transformToByteArray(),
      contentType: response.ContentType ?? 'application/octet-stream',
    }
  } catch {
    return null
  }
}
