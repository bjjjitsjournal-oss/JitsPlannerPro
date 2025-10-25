// Cloudflare R2 storage service using S3-compatible API
import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const R2_BUCKET = process.env.R2_BUCKET_NAME || 'itsjournal-videos';

// Initialize R2 client (lazy initialization to provide better error messages)
function getR2Client(): S3Client {
  if (!process.env.R2_ENDPOINT) {
    throw new Error('R2_ENDPOINT environment variable is not set');
  }
  if (!process.env.R2_ACCESS_KEY_ID) {
    throw new Error('R2_ACCESS_KEY_ID environment variable is not set');
  }
  if (!process.env.R2_SECRET_ACCESS_KEY) {
    throw new Error('R2_SECRET_ACCESS_KEY environment variable is not set');
  }

  return new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });
}

/**
 * Upload a file to R2 storage
 */
export async function uploadToR2(
  fileBuffer: Buffer,
  fileName: string,
  contentType: string
): Promise<{ url: string; key: string }> {
  const key = `videos/${Date.now()}-${fileName}`;
  const client = getR2Client();

  await client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
    })
  );

  // Generate public URL
  const url = `${process.env.R2_ENDPOINT}/${R2_BUCKET}/${key}`;

  return { url, key };
}

/**
 * Delete a file from R2 storage
 */
export async function deleteFromR2(key: string): Promise<void> {
  const client = getR2Client();
  await client.send(
    new DeleteObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
    })
  );
}

/**
 * Get file size from R2
 */
export async function getR2FileSize(key: string): Promise<number> {
  const client = getR2Client();
  const response = await client.send(
    new HeadObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
    })
  );

  return response.ContentLength || 0;
}

/**
 * Generate signed URL for temporary access
 */
export async function getR2SignedUrl(key: string, expiresIn = 3600): Promise<string> {
  const client = getR2Client();
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
  });

  return await getSignedUrl(client, command, { expiresIn });
}

/**
 * Check if a file exists in R2
 */
export async function r2FileExists(key: string): Promise<boolean> {
  try {
    const client = getR2Client();
    await client.send(
      new HeadObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
      })
    );
    return true;
  } catch (error) {
    return false;
  }
}
