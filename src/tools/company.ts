import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { NinjaClient } from '../ninja.js';

export function registerCompanyTools(server: McpServer, ninja: NinjaClient): void {
  server.tool(
    'get_company_settings',
    'Obtiene la configuración y datos fiscales de la empresa en Invoice Ninja',
    {},
    async () => {
      const res = await ninja.get<{ data: Record<string, unknown>[] }>('/companies');
      const company = res.data[0];
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(company, null, 2) }],
      };
    },
  );

  server.tool(
    'update_company_settings',
    'Actualiza datos de la empresa: nombre, dirección, NIF, email, teléfono, etc.',
    {
      name: z.string().optional().describe('Nombre de la empresa'),
      address1: z.string().optional().describe('Dirección línea 1'),
      address2: z.string().optional().describe('Dirección línea 2'),
      city: z.string().optional().describe('Ciudad'),
      state: z.string().optional().describe('Provincia'),
      postal_code: z.string().optional().describe('Código postal'),
      country_id: z.string().optional().describe('ID de país (724 = España)'),
      vat_number: z.string().optional().describe('NIF/CIF'),
      phone: z.string().optional().describe('Teléfono'),
      email: z.string().optional().describe('Email de contacto'),
      website: z.string().optional().describe('Sitio web'),
    },
    async (params) => {
      const res = await ninja.get<{ data: Record<string, unknown>[] }>('/companies');
      const company = res.data[0] as { id: string; settings: Record<string, unknown> };
      const { name, ...settingsFields } = params;

      const updated = await ninja.put<{ data: Record<string, unknown> }>(
        `/companies/${company.id}`,
        {
          ...(name ? { name } : {}),
          settings: { ...company.settings, ...settingsFields },
        },
      );
      return {
        content: [{ type: 'text' as const, text: `Empresa actualizada:\n${JSON.stringify(updated.data, null, 2)}` }],
      };
    },
  );
}
