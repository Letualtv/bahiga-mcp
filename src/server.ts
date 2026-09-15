import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerCompanyTools } from './tools/company.js';
import { registerProductTools } from './tools/products.js';
import { registerClientTools } from './tools/clients.js';
import { registerQuoteTools } from './tools/quotes.js';
import { registerInvoiceTools } from './tools/invoices.js';
import { registerRecurringTools } from './tools/recurring.js';
import { createNinjaClient } from './ninja.js';

export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: 'bahiga-invoice-ninja',
    version: '1.0.0',
  });

  const ninja = createNinjaClient();

  registerCompanyTools(server, ninja);
  registerProductTools(server, ninja);
  registerClientTools(server, ninja);
  registerQuoteTools(server, ninja);
  registerInvoiceTools(server, ninja);
  registerRecurringTools(server, ninja);

  return server;
}
