import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { NinjaClient } from '../ninja.js';

const FREQUENCY_MAP: Record<string, string> = {
  daily: '1', weekly: '2', biweekly: '3', monthly: '4',
  bimonthly: '5', quarterly: '6', semiannual: '8', annual: '9',
};

const LineItemSchema = z.object({
  product_key: z.string().describe('Nombre del servicio'),
  notes: z.string().optional().describe('Descripción'),
  quantity: z.number().default(1),
  cost: z.number().describe('Precio unitario sin IVA'),
  tax_name1: z.string().optional().default('IVA'),
  tax_rate1: z.number().optional().default(21),
});

export function registerRecurringTools(server: McpServer, ninja: NinjaClient): void {
  server.tool(
    'list_recurring_invoices',
    'Lista facturas recurrentes con su estado (activa/pausada)',
    {
      status: z.enum(['all', 'active', 'paused', 'completed']).optional().default('all'),
    },
    async ({ status }) => {
      const qs = new URLSearchParams();
      if (status && status !== 'all') qs.set('client_status', status);
      const res = await ninja.get<{ data: unknown[] }>(`/recurring_invoices?${qs}`);
      return { content: [{ type: 'text' as const, text: JSON.stringify(res.data, null, 2) }] };
    },
  );

  server.tool(
    'create_recurring_invoice',
    'Crea una factura recurrente automática para un cliente',
    {
      client_id: z.string().describe('ID del cliente'),
      line_items: z.array(LineItemSchema).min(1).describe('Líneas de la factura'),
      frequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly', 'bimonthly', 'quarterly', 'semiannual', 'annual']).describe('Frecuencia de emisión'),
      start_date: z.string().describe('Fecha de inicio (YYYY-MM-DD)'),
      due_date_days: z.number().optional().default(30).describe('Días de vencimiento desde emisión'),
      auto_bill: z.enum(['always', 'opt_in', 'opt_out', 'off']).optional().default('off').describe('Cobro automático'),
    },
    async ({ client_id, line_items, frequency, start_date, due_date_days, auto_bill }) => {
      const res = await ninja.post<{ data: unknown }>('/recurring_invoices', {
        client_id,
        line_items,
        frequency_id: FREQUENCY_MAP[frequency],
        next_send_date: start_date,
        due_date_days: String(due_date_days),
        auto_bill,
      });
      return { content: [{ type: 'text' as const, text: `Factura recurrente creada:\n${JSON.stringify(res.data, null, 2)}` }] };
    },
  );

  server.tool(
    'get_recurring_invoice',
    'Obtiene el detalle de una factura recurrente',
    { recurring_id: z.string().describe('ID de la factura recurrente') },
    async ({ recurring_id }) => {
      const res = await ninja.get<{ data: unknown }>(`/recurring_invoices/${recurring_id}`);
      return { content: [{ type: 'text' as const, text: JSON.stringify(res.data, null, 2) }] };
    },
  );

  server.tool(
    'update_recurring_invoice',
    'Actualiza frecuencia, líneas o importe de una factura recurrente',
    {
      recurring_id: z.string().describe('ID de la factura recurrente'),
      line_items: z.array(LineItemSchema).optional().describe('Nuevas líneas'),
      frequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly', 'bimonthly', 'quarterly', 'semiannual', 'annual']).optional().describe('Nueva frecuencia'),
      due_date_days: z.number().optional().describe('Nuevos días de vencimiento'),
    },
    async ({ recurring_id, frequency, ...fields }) => {
      const body = {
        ...fields,
        ...(frequency ? { frequency_id: FREQUENCY_MAP[frequency] } : {}),
        ...(fields.due_date_days !== undefined ? { due_date_days: String(fields.due_date_days) } : {}),
      };
      const res = await ninja.put<{ data: unknown }>(`/recurring_invoices/${recurring_id}`, body);
      return { content: [{ type: 'text' as const, text: `Factura recurrente actualizada:\n${JSON.stringify(res.data, null, 2)}` }] };
    },
  );

  server.tool(
    'start_recurring_invoice',
    'Activa o reanuda una factura recurrente pausada',
    { recurring_id: z.string().describe('ID de la factura recurrente') },
    async ({ recurring_id }) => {
      await ninja.post('/recurring_invoices/bulk', { action: 'start', ids: [recurring_id] });
      return { content: [{ type: 'text' as const, text: `Factura recurrente ${recurring_id} activada.` }] };
    },
  );

  server.tool(
    'stop_recurring_invoice',
    'Pausa una factura recurrente activa',
    { recurring_id: z.string().describe('ID de la factura recurrente') },
    async ({ recurring_id }) => {
      await ninja.post('/recurring_invoices/bulk', { action: 'stop', ids: [recurring_id] });
      return { content: [{ type: 'text' as const, text: `Factura recurrente ${recurring_id} pausada.` }] };
    },
  );
}
