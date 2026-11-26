import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'dg-test-'));
(process.env as any).NODE_ENV = 'test';
delete process.env.OPENAI_API_KEY; delete process.env.TOSS_SECRET_KEY;
