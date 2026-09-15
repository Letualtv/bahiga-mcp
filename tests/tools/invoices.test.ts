import { describe, it, expect, vi, beforeEach } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { NinjaClient } from '../../src/ninja.js';
import { registerInvoiceTools } from '../../src/tools/invoices.js';

const mockNinja = {
  get: vi.fn(), post: vi.fn(),
} as unknown as NinjaClient;

describe('invoice tools', () => {
  beforeEach(() => vi.clearAllMocks());

  it('registra los 4 tools de facturas', () => {
    const server = new McpServer({ name: 'test', version: '0.0.1' });
    registerInvoiceTools(server, mockNinja);
    const tools = (server as any)._registeredTools;
    expect(tools).toHaveProperty('list_invoices');
    expect(tools).toHaveProperty('get_invoice');
    expect(tools).toHaveProperty('send_invoice');
    expect(tools).toHaveProperty('mark_invoice_paid');
  });
});
