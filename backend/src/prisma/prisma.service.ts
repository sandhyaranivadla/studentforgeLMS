import 'dotenv/config';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as fs from 'fs';

interface SslConfig {
  rejectUnauthorized: boolean;
  ca: string;
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    const connectionString = process.env.DATABASE_URL || '';
    let ssl: SslConfig | false = false;

    if (connectionString && connectionString.includes('sslmode=verify-full')) {
      const match = connectionString.match(/sslrootcert=([^&]+)/);
      if (match && match[1]) {
        try {
          ssl = {
            rejectUnauthorized: false,
            ca: fs.readFileSync(match[1]).toString(),
          };
        } catch {
          console.warn(
            `Could not read sslrootcert from ${match[1]}, continuing without custom pg ssl ca`,
          );
        }
      }
    }

    const pool = new Pool({ connectionString, ssl: ssl || undefined });
    const adapter = new PrismaPg(pool);
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }
}
