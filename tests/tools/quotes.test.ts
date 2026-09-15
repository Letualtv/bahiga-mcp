import { describe, it, expect, vi, beforeEach } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { NinjaClient } from '../../src/ninja.js';
import { registerQuoteTools } from '../../src/tools/quotes.js';

const mockNinja = {
  get: vi.fn(), post: vi.fn(),
} as unknown as NinjaClient;

describe('quote tools', () => {
  beforeEach(() => vi.clearAllMocks());

  it('registra los 5 tools de presupuestos', () => {
    const server = new McpServer({ name: 'test', version: '0.0.1' });
    registerQuoteTools(server, mockNinja);
    const tools = (server as any)._registeredTools;
    expect(tools).toHaveProperty('list_quotes');
    expect(tools).toHaveProperty('create_quote');
    expect(tools).toHaveProperty('get_quote');
    expect(tools).toHaveProperty('send_quote');
    expect(tools).toHaveProperty('convert_quote_to_invoice');
  });
});
