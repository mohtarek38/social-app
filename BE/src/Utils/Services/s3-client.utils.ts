import {
  PutObjectCommand,
  PutObjectCommandInput,
  GetObjectCommand,
  S3Client,
  DeleteObjectCommand,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import fs from "node:fs";
import { BadRequestException } from "../utils.barrel";

interface IPutObjectCommand extends PutObjectCommandInput {
  Body: string | Buffer | fs.ReadStream;
}

export class S3ClientService {
  private s3Client = new S3Client({
    region: process.env.AWS_REGION as string,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
    },
  });
  private key_folder = process.env.AWS_S3_KEY_FOLDER as string;

  async getFileWithSignedURL(key: string, expiryInSeconds: number = 60) {
    const command = new GetObjectCommand({
      Bucket: process.env.BUCKET_NAME as string,
      Key: key,
    });
    return await getSignedUrl(this.s3Client, command, { expiresIn: expiryInSeconds });
  }

  async uploadOneFileOnS3(file: Express.Multer.File, key: string) {
    const keyName = `${this.key_folder}/${key}/${Date.now()}_${file.originalname}`;
    const params: IPutObjectCommand = {
      Bucket: process.env.BUCKET_NAME as string,
      Key: keyName,
      Body: fs.createReadStream(file.path),
      ContentType: file.mimetype,
      // ACL: "public-read",        // Uncomment this line if you want the file to be publicly accessible
    };
    const putCommand = new PutObjectCommand(params);
    const result = await this.s3Client.send(putCommand);
    if (result.$metadata.httpStatusCode !== 200) {
      throw new BadRequestException("Failed to upload file to S3");
    }

    try {
      fs.unlinkSync(file.path);
    } catch (err) {
      console.error("Failed to delete local uploaded file", file.path, err);
    }
    const getSignedUrl = await this.getFileWithSignedURL(keyName, 3600);
    return { key: keyName, url: getSignedUrl };
  }

  async uploadMultipleFilesOnS3(files: Express.Multer.File[], key: string) {
    const keys = files.map((file) => this.uploadOneFileOnS3(file, key));
    return await Promise.all(keys);
  }

  async deleteFileFromS3(key: string) {
    const params = {
      Bucket: process.env.BUCKET_NAME as string,
      Key: key,
    };
    const deleteCommand = new DeleteObjectCommand(params);
    return await this.s3Client.send(deleteCommand);
  }

  async deleteBulkFilesFromS3(keys: string[]) {
    const params = {
      Bucket: process.env.BUCKET_NAME as string,
      Delete: { Objects: keys.map((key) => ({ Key: key })) },
    };
    const deleteCommand = new DeleteObjectsCommand(params);
    return await this.s3Client.send(deleteCommand);
  }
}
