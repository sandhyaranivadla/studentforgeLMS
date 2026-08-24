import 'dotenv/config';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as fs from 'fs';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    let connectionString = process.env.DATABASE_URL || '';
    let ssl: any = false;

    if (connectionString && connectionString.includes('sslmode=verify-full')) {
      const match = connectionString.match(/sslrootcert=([^&]+)/);
      if (match && match[1]) {
        ssl = {
          rejectUnauthorized: true,
          ca: fs.readFileSync(match[1]).toString(),
        };
      }
    }

    const pool = new Pool({ connectionString, ssl });
    const adapter = new PrismaPg(pool);
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }
}
