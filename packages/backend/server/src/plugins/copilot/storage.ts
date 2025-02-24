import { createHash } from 'node:crypto';

import { Injectable, PayloadTooLargeException } from '@nestjs/common';

import { QuotaManagementService } from '../../core/quota';
import {
  type BlobInputType,
  Config,
  type FileUpload,
  type StorageProvider,
  StorageProviderFactory,
} from '../../fundamentals';

@Injectable()
export class CopilotStorage {
  public readonly provider: StorageProvider;

  constructor(
    private readonly config: Config,
    private readonly storageFactory: StorageProviderFactory,
    private readonly quota: QuotaManagementService
  ) {
    this.provider = this.storageFactory.create('copilot');
  }

  async put(
    userId: string,
    workspaceId: string,
    key: string,
    blob: BlobInputType
  ) {
    const name = `${userId}/${workspaceId}/${key}`;
    await this.provider.put(name, blob);
    return `${this.config.baseUrl}/api/copilot/blob/${name}`;
  }

  async get(userId: string, workspaceId: string, key: string) {
    return this.provider.get(`${userId}/${workspaceId}/${key}`);
  }

  async delete(userId: string, workspaceId: string, key: string) {
    return this.provider.delete(`${userId}/${workspaceId}/${key}`);
  }

  async handleUpload(userId: string, blob: FileUpload) {
    const checkExceeded = await this.quota.getQuotaCalculator(userId);

    if (checkExceeded(0)) {
      throw new PayloadTooLargeException(
        'Storage or blob size limit exceeded.'
      );
    }
    const buffer = await new Promise<Buffer>((resolve, reject) => {
      const stream = blob.createReadStream();
      const chunks: Uint8Array[] = [];
      stream.on('data', chunk => {
        chunks.push(chunk);

        // check size after receive each chunk to avoid unnecessary memory usage
        const bufferSize = chunks.reduce((acc, cur) => acc + cur.length, 0);
        if (checkExceeded(bufferSize)) {
          reject(
            new PayloadTooLargeException('Storage or blob size limit exceeded.')
          );
        }
      });
      stream.on('error', reject);
      stream.on('end', () => {
        const buffer = Buffer.concat(chunks);

        if (checkExceeded(buffer.length)) {
          reject(new PayloadTooLargeException('Storage limit exceeded.'));
        } else {
          resolve(buffer);
        }
      });
    });

    return {
      buffer,
      filename: blob.filename,
    };
  }

  async handleRemoteLink(userId: string, workspaceId: string, link: string) {
    const response = await fetch(link);
    const buffer = new Uint8Array(await response.arrayBuffer());
    const filename = createHash('sha256').update(buffer).digest('base64url');
    return this.put(userId, workspaceId, filename, Buffer.from(buffer));
  }
}
