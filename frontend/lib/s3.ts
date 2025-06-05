import type { S3Client } from "@aws-sdk/client-s3";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Lazy-loaded S3 client
let s3Client: S3Client | null = null;

async function getS3Client(): Promise<S3Client> {
  if (!s3Client) {
    const { S3Client: S3ClientClass } = await import("@aws-sdk/client-s3");

    // Initialize S3 client
    s3Client = new S3ClientClass({
      region: process.env.AWS_REGION || "us-west-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
      },
    });
  }

  return s3Client;
}

export const uploadToS3 = async (
  file: Buffer,
  key: string,
  contentType: string
) => {
  const bucketName = process.env.S3_BUCKET;

  if (!bucketName) {
    throw new Error("S3_BUCKET environment variable not set");
  }

  const { PutObjectCommand } = await import("@aws-sdk/client-s3");
  const client = await getS3Client();

  const params = {
    Bucket: bucketName,
    Key: key,
    Body: file,
    ContentType: contentType,
  };

  try {
    await client.send(new PutObjectCommand(params));
    return `https://${bucketName}.s3.amazonaws.com/${key}`;
  } catch (error) {
    console.error("Error uploading to S3:", error);
    throw new Error("Failed to upload file to S3");
  }
};

export const getFromS3 = async (key: string) => {
  const bucketName = process.env.S3_BUCKET;

  if (!bucketName) {
    throw new Error("S3_BUCKET environment variable not set");
  }

  const { GetObjectCommand } = await import("@aws-sdk/client-s3");
  const client = await getS3Client();

  const params = {
    Bucket: bucketName,
    Key: key,
  };

  try {
    const response = await client.send(new GetObjectCommand(params));
    return response;
  } catch (error) {
    console.error("Error getting from S3:", error);
    throw new Error("Failed to get file from S3");
  }
};

export const deleteFromS3 = async (key: string) => {
  const bucketName = process.env.S3_BUCKET;

  if (!bucketName) {
    throw new Error("S3_BUCKET environment variable not set");
  }

  const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");
  const client = await getS3Client();

  const params = {
    Bucket: bucketName,
    Key: key,
  };

  try {
    await client.send(new DeleteObjectCommand(params));
  } catch (error) {
    console.error("Error deleting from S3:", error);
    throw new Error("Failed to delete file from S3");
  }
};

export default getS3Client;
