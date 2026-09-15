import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch global
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Importar después del mock
const { NinjaClient } = await import('../src/ninja.js');

describe('NinjaClient', () => {
  let client: InstanceType<typeof NinjaClient>;

  beforeEach(() => {
    mockFetch.mockReset();
    client = new NinjaClient('https://facturas.bahiga.es', 'test-token');
  });

  it('añade X-Api-Token y Content-Type en GET', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { id: '1', name: 'Empresa' } }),
    });

    await client.get('/companies/1');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://facturas.bahiga.es/api/v1/companies/1',
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-Api-Token': 'test-token',
          'Content-Type': 'application/json',
        }),
      }),
    );
  });

  it('lanza error cuando la respuesta no es ok', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 422,
      text: async () => 'Validation error',
    });

    await expect(client.get('/clients/404')).rejects.toThrow('Invoice Ninja API 422');
  });

  it('serializa body en POST', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { id: '99' } }),
    });

    await client.post('/products', { product_key: 'Dev', cost: 1000 });

    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(options.body as string)).toEqual({ product_key: 'Dev', cost: 1000 });
  });
});
