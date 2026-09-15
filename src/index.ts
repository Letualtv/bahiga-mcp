import 'dotenv/config';
import express from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createAuthMiddleware } from './auth.js';
import { createMcpServer } from './server.js';

function corsMiddleware(req: express.Request, res: express.Response, next: express.NextFunction): void {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  if (req.method === 'OPTIONS') { res.sendStatus(200); return; }
  next();
}

const app = express();
app.use(express.json());
app.use(corsMiddleware);

const authToken = process.env.MCP_AUTH_TOKEN;
if (!authToken) throw new Error('MCP_AUTH_TOKEN es obligatorio');

app.post('/mcp', createAuthMiddleware(authToken), async (req, res) => {
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  const server = createMcpServer();
  res.on('close', () => transport.close());
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

const port = parseInt(process.env.PORT ?? '3500', 10);
app.listen(port, () => console.log(`bahiga-mcp escuchando en :${port}`));
