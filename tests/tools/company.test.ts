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

  it('registra update_company_preferences', () => {
    const server = makeServer();
    const tools = (server as any)._registeredTools;
    expect(tools).toHaveProperty('update_company_preferences');
  });

  it('registra list_designs', () => {
    const server = makeServer();
    const tools = (server as any)._registeredTools;
    expect(tools).toHaveProperty('list_designs');
  });

  it('update_company_preferences fusiona settings sin borrar campos existentes', async () => {
    const existingSettings = {
      currency_id: '3',
      timezone_id: '15',
      invoice_terms: 'Pago a 30 días',
      primary_color: '#1A6B8A',
    };
    const fakeCompany = { id: 'abc123', settings: existingSettings };

    (mockNinja.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: [fakeCompany],
    });
    (mockNinja.put as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { ...fakeCompany, settings: { ...existingSettings, primary_color: '#C9821A' } },
    });

    const server = makeServer();
    const tool = (server as any)._registeredTools['update_company_preferences'];
    await tool.handler({ primary_color: '#C9821A' });

    const [, body] = (mockNinja.put as ReturnType<typeof vi.fn>).mock.calls[0] as [string, Record<string, unknown>];
    const settings = body.settings as Record<string, unknown>;

    // Los campos pre-existentes deben estar presentes
    expect(settings.currency_id).toBe('3');
    expect(settings.timezone_id).toBe('15');
    expect(settings.invoice_terms).toBe('Pago a 30 días');
    // El campo nuevo debe aplicarse
    expect(settings.primary_color).toBe('#C9821A');
    // update_products no debe estar en el body si no se pasó
    expect(body.update_products).toBeUndefined();
  });

  it('update_company_preferences envía update_products como campo de primer nivel', async () => {
    const fakeCompany = { id: 'abc123', settings: { currency_id: '3' } };
    (mockNinja.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: [fakeCompany] });
    (mockNinja.put as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: fakeCompany });

    const server = makeServer();
    const tool = (server as any)._registeredTools['update_company_preferences'];
    await tool.handler({ update_products: true });

    const [, body] = (mockNinja.put as ReturnType<typeof vi.fn>).mock.calls[0] as [string, Record<string, unknown>];
    expect(body.update_products).toBe(true);
    // No debe estar dentro de settings
    const settings = body.settings as Record<string, unknown>;
    expect(settings.update_products).toBeUndefined();
  });
});
