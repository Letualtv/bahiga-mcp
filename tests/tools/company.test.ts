import { describe, it, expect, vi, beforeEach } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { NinjaClient } from '../../src/ninja.js';
import { registerCompanyTools } from '../../src/tools/company.js';

const mockNinja = {
  get: vi.fn(),
  put: vi.fn(),
} as unknown as NinjaClient;

function makeServer() {
  const server = new McpServer({ name: 'test', version: '0.0.1' });
  registerCompanyTools(server, mockNinja);
  return server;
}

describe('company tools', () => {
  beforeEach(() => vi.clearAllMocks());

  it('registra get_company_settings', () => {
    const server = makeServer();
    const tools = (server as any)._registeredTools;
    expect(tools).toHaveProperty('get_company_settings');
  });

  it('registra update_company_settings', () => {
    const server = makeServer();
    const tools = (server as any)._registeredTools;
    expect(tools).toHaveProperty('update_company_settings');
  });
});
