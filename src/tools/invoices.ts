import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { NinjaClient } from '../ninja.js';

export function registerInvoiceTools(server: McpServer, ninja: NinjaClient): void {
  server.tool(
    'list_invoices',
    'Lista facturas con filtro por estado',
    {
      status: z.enum(['all', 'draft', 'sent', 'partial', 'paid', 'overdue', 'unpaid']).optional().default('all').describe('Estado de la factura'),
      client_id: z.string().optional().describe('Filtrar por ID de cliente'),
      per_page: z.number().optional().default(25),
    },
    async ({ status, client_id, per_page }) => {
      const qs = new URLSearchParams({ per_page: String(per_page) });
      if (status && status !== 'all') qs.set('client_status', status);
      if (client_id) qs.set('client_id', client_id);
      const res = await ninja.get<{ data: unknown[] }>(`/invoices?${qs}`);
      return { content: [{ type: 'text' as const, text: JSON.stringify(res.data, null, 2) }] };
    },
  );

  server.tool(
    'get_invoice',
    'Obtiene el detalle de una factura incluyendo URL pública y enlace al PDF',
    { invoice_id: z.string().describe('ID de la factura') },
    async ({ invoice_id }) => {
      const res = await ninja.get<{ data: unknown }>(`/invoices/${invoice_id}`);
      return { content: [{ type: 'text' as const, text: JSON.stringify(res.data, null, 2) }] };
    },
  );

  server.tool(
    'send_invoice',
    'Envía la factura por email al cliente',
    {
      invoice_id: z.string().describe('ID de la factura'),
      subject: z.string().optional().describe('Asunto del email'),
      body: z.string().optional().describe('Cuerpo del email'),
    },
    async ({ invoice_id, subject, body }) => {
      await ninja.post(`/invoices/${invoice_id}/email`, {
        ...(subject ? { subject } : {}),
        ...(body ? { body } : {}),
      });
      return { content: [{ type: 'text' as const, text: `Factura ${invoice_id} enviada por email correctamente.` }] };
    },
  );

  server.tool(
    'mark_invoice_paid',
    'Marca una factura como pagada creando un registro de pago',
    {
      invoice_id: z.string().describe('ID de la factura'),
      client_id: z.string().describe('ID del cliente de la factura'),
      amount: z.number().describe('Importe pagado en euros'),
      date: z.string().optional().describe('Fecha del pago (YYYY-MM-DD, por defecto hoy)'),
      payment_type: z.enum(['bank_transfer', 'card', 'cash', 'paypal', 'other']).optional().default('bank_transfer').describe('Método de pago'),
    },
    async ({ invoice_id, client_id, amount, date, payment_type }) => {
      const typeMap: Record<string, string> = {
        bank_transfer: '1', card: '4', cash: '2', paypal: '17', other: '25',
      };
      const res = await ninja.post<{ data: unknown }>('/payments', {
        client_id,
        amount,
        date: date ?? new Date().toISOString().split('T')[0],
        type_id: typeMap[payment_type ?? 'bank_transfer'],
        invoices: [{ invoice_id, amount }],
      });
      return { content: [{ type: 'text' as const, text: `Factura ${invoice_id} marcada como pagada:\n${JSON.stringify(res.data, null, 2)}` }] };
    },
  );
}
