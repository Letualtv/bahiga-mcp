import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { NinjaClient } from '../ninja.js';

const LineItemSchema = z.object({
  product_key: z.string().describe('Nombre del servicio/producto'),
  notes: z.string().optional().describe('Descripción detallada de la línea'),
  quantity: z.number().default(1).describe('Cantidad'),
  cost: z.number().describe('Precio unitario en euros (sin IVA)'),
  tax_name1: z.string().optional().default('IVA'),
  tax_rate1: z.number().optional().default(21),
});

export function registerQuoteTools(server: McpServer, ninja: NinjaClient): void {
  server.tool(
    'list_quotes',
    'Lista presupuestos con filtro opcional por estado',
    {
      status: z.enum(['all', 'draft', 'sent', 'approved', 'expired']).optional().default('all').describe('Estado del presupuesto'),
      client_id: z.string().optional().describe('Filtrar por ID de cliente'),
      per_page: z.number().optional().default(25),
    },
    async ({ status, client_id, per_page }) => {
      const qs = new URLSearchParams({ per_page: String(per_page) });
      if (status && status !== 'all') qs.set('client_status', status);
      if (client_id) qs.set('client_id', client_id);
      const res = await ninja.get<{ data: unknown[] }>(`/quotes?${qs}`);
      return { content: [{ type: 'text' as const, text: JSON.stringify(res.data, null, 2) }] };
    },
  );

  server.tool(
    'create_quote',
    'Crea un presupuesto con uno o varios servicios para un cliente',
    {
      client_id: z.string().describe('ID del cliente'),
      line_items: z.array(LineItemSchema).min(1).describe('Líneas del presupuesto'),
      valid_until: z.string().optional().describe('Fecha límite de validez (YYYY-MM-DD)'),
      po_number: z.string().optional().describe('Número de referencia del cliente'),
      notes: z.string().optional().describe('Notas públicas visibles en el presupuesto'),
      terms: z.string().optional().describe('Términos y condiciones'),
    },
    async (params) => {
      const res = await ninja.post<{ data: unknown }>('/quotes', params);
      return { content: [{ type: 'text' as const, text: `Presupuesto creado:\n${JSON.stringify(res.data, null, 2)}` }] };
    },
  );

  server.tool(
    'get_quote',
    'Obtiene el detalle de un presupuesto incluyendo URL de vista pública',
    { quote_id: z.string().describe('ID del presupuesto') },
    async ({ quote_id }) => {
      const res = await ninja.get<{ data: unknown }>(`/quotes/${quote_id}`);
      return { content: [{ type: 'text' as const, text: JSON.stringify(res.data, null, 2) }] };
    },
  );

  server.tool(
    'send_quote',
    'Envía el presupuesto por email al cliente',
    {
      quote_id: z.string().describe('ID del presupuesto'),
      subject: z.string().optional().describe('Asunto del email'),
      body: z.string().optional().describe('Cuerpo del email'),
    },
    async ({ quote_id, subject, body }) => {
      await ninja.post(`/quotes/${quote_id}/email`, {
        ...(subject ? { subject } : {}),
        ...(body ? { body } : {}),
      });
      return { content: [{ type: 'text' as const, text: `Presupuesto ${quote_id} enviado por email correctamente.` }] };
    },
  );

  server.tool(
    'convert_quote_to_invoice',
    'Convierte un presupuesto aprobado en factura',
    { quote_id: z.string().describe('ID del presupuesto a convertir') },
    async ({ quote_id }) => {
      const res = await ninja.post<{ data: unknown[] }>('/quotes/bulk', {
        action: 'convert_to_invoice',
        ids: [quote_id],
      });
      return {
        content: [{ type: 'text' as const, text: `Factura creada desde presupuesto:\n${JSON.stringify(res.data?.[0], null, 2)}` }],
      };
    },
  );
}
