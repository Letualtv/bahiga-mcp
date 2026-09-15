import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { NinjaClient } from '../ninja.js';

export function registerClientTools(server: McpServer, ninja: NinjaClient): void {
  server.tool(
    'list_clients',
    'Lista o busca clientes por nombre o email',
    {
      search: z.string().optional().describe('Texto para buscar por nombre o email'),
      per_page: z.number().optional().default(25).describe('Resultados por página (máx 100)'),
    },
    async ({ search, per_page }) => {
      const qs = new URLSearchParams({ per_page: String(per_page) });
      if (search) qs.set('filter', search);
      const res = await ninja.get<{ data: unknown[] }>(`/clients?${qs}`);
      return { content: [{ type: 'text' as const, text: JSON.stringify(res.data, null, 2) }] };
    },
  );

  server.tool(
    'create_client',
    'Crea un nuevo cliente en Invoice Ninja',
    {
      name: z.string().describe('Nombre completo o razón social'),
      email: z.string().optional().describe('Email de contacto'),
      vat_number: z.string().optional().describe('NIF/CIF'),
      address1: z.string().optional().describe('Dirección'),
      city: z.string().optional().describe('Ciudad'),
      state: z.string().optional().describe('Provincia'),
      postal_code: z.string().optional().describe('Código postal'),
      phone: z.string().optional().describe('Teléfono'),
      website: z.string().optional().describe('Sitio web'),
    },
    async (params) => {
      const res = await ninja.post<{ data: unknown }>('/clients', params);
      return { content: [{ type: 'text' as const, text: `Cliente creado:\n${JSON.stringify(res.data, null, 2)}` }] };
    },
  );

  server.tool(
    'get_client',
    'Obtiene el detalle completo de un cliente incluido historial de facturas y presupuestos',
    { client_id: z.string().describe('ID del cliente') },
    async ({ client_id }) => {
      const res = await ninja.get<{ data: unknown }>(`/clients/${client_id}`);
      return { content: [{ type: 'text' as const, text: JSON.stringify(res.data, null, 2) }] };
    },
  );

  server.tool(
    'update_client',
    'Actualiza los datos de un cliente existente',
    {
      client_id: z.string().describe('ID del cliente'),
      name: z.string().optional().describe('Nuevo nombre'),
      email: z.string().optional().describe('Nuevo email'),
      vat_number: z.string().optional().describe('Nuevo NIF/CIF'),
      address1: z.string().optional().describe('Nueva dirección'),
      city: z.string().optional().describe('Nueva ciudad'),
      state: z.string().optional().describe('Nueva provincia'),
      postal_code: z.string().optional().describe('Nuevo código postal'),
      phone: z.string().optional().describe('Nuevo teléfono'),
    },
    async ({ client_id, ...fields }) => {
      const res = await ninja.put<{ data: unknown }>(`/clients/${client_id}`, fields);
      return { content: [{ type: 'text' as const, text: `Cliente actualizado:\n${JSON.stringify(res.data, null, 2)}` }] };
    },
  );

  server.tool(
    'archive_client',
    'Archiva un cliente (Invoice Ninja no permite borrar clientes con historial)',
    { client_id: z.string().describe('ID del cliente a archivar') },
    async ({ client_id }) => {
      await ninja.post('/clients/bulk', { action: 'archive', ids: [client_id] });
      return { content: [{ type: 'text' as const, text: `Cliente ${client_id} archivado correctamente.` }] };
    },
  );
}
