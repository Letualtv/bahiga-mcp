import { describe, it, expect, vi, beforeEach } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { NinjaClient } from '../../src/ninja.js';
import { registerClientTools } from '../../src/tools/clients.js';

const mockNinja = {
  get: vi.fn(), post: vi.fn(), put: vi.fn(),
} as unknown as NinjaClient;

describe('client tools', () => {
  beforeEach(() => vi.clearAllMocks());

  it('registra los 5 tools de clientes', () => {
    const server = new McpServer({ name: 'test', version: '0.0.1' });
    registerClientTools(server, mockNinja);
    const tools = (server as any)._registeredTools;
    expect(tools).toHaveProperty('list_clients');
    expect(tools).toHaveProperty('create_client');
    expect(tools).toHaveProperty('get_client');
    expect(tools).toHaveProperty('update_client');
    expect(tools).toHaveProperty('archive_client');
  });
});
