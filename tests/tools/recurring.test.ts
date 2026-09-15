import { describe, it, expect, vi, beforeEach } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { NinjaClient } from '../../src/ninja.js';
import { registerRecurringTools } from '../../src/tools/recurring.js';

const mockNinja = {
  get: vi.fn(), post: vi.fn(), put: vi.fn(),
} as unknown as NinjaClient;

describe('recurring tools', () => {
  beforeEach(() => vi.clearAllMocks());

  it('registra los 6 tools de recurrentes', () => {
    const server = new McpServer({ name: 'test', version: '0.0.1' });
    registerRecurringTools(server, mockNinja);
    const tools = (server as any)._registeredTools;
    expect(tools).toHaveProperty('list_recurring_invoices');
    expect(tools).toHaveProperty('create_recurring_invoice');
    expect(tools).toHaveProperty('get_recurring_invoice');
    expect(tools).toHaveProperty('update_recurring_invoice');
    expect(tools).toHaveProperty('start_recurring_invoice');
    expect(tools).toHaveProperty('stop_recurring_invoice');
  });
});
