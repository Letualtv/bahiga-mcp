import { describe, it, expect, vi, beforeEach } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { NinjaClient } from '../../src/ninja.js';
import { registerProductTools } from '../../src/tools/products.js';

const mockNinja = {
  get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn(),
} as unknown as NinjaClient;

describe('product tools', () => {
  beforeEach(() => vi.clearAllMocks());

  it('registra los 4 tools de productos', () => {
    const server = new McpServer({ name: 'test', version: '0.0.1' });
    registerProductTools(server, mockNinja);
    const tools = (server as any)._registeredTools;
    expect(tools).toHaveProperty('list_products');
    expect(tools).toHaveProperty('create_product');
    expect(tools).toHaveProperty('update_product');
    expect(tools).toHaveProperty('delete_product');
  });
});
