import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { NinjaClient } from '../ninja.js';

const HexColor = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Debe ser un color hex válido (#RRGGBB)');

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
    'Actualiza datos de identidad de la empresa: nombre, dirección, NIF, email, teléfono, etc.',
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

  server.tool(
    'update_company_preferences',
    'Actualiza preferencias de comportamiento y apariencia de la empresa: facturación, recordatorios, diseño PDF, colores, textos legales, email y tarifas. Lee la configuración actual y fusiona solo los campos recibidos, sin borrar el resto.',
    {
      // Facturación
      update_products: z.boolean().optional().describe('Actualizar precios de productos al editar líneas de factura (campo de primer nivel)'),
      lock_invoices: z.enum(['off', 'when_sent', 'when_paid']).optional().describe('Cuándo bloquear facturas para edición'),
      auto_convert_quote: z.boolean().optional().describe('Convertir presupuesto a factura automáticamente al aprobarse'),
      payment_terms: z.string().optional().describe('Días de vencimiento por defecto (ej: "30")'),
      valid_until: z.string().optional().describe('Días de validez de presupuestos por defecto (ej: "14")'),
      // Recordatorios
      enable_reminder1: z.boolean().optional().describe('Activar primer recordatorio de pago'),
      num_days_reminder1: z.number().int().optional().describe('Días para el primer recordatorio'),
      schedule_reminder1: z.enum(['after_invoice_date', 'before_due_date', 'after_due_date']).optional().describe('Cuándo se cuenta el recordatorio'),
      // Diseño PDF
      page_layout: z.enum(['portrait', 'landscape']).optional().describe('Orientación de página en PDFs'),
      font_size: z.number().int().optional().describe('Tamaño de fuente en PDFs'),
      page_numbering: z.boolean().optional().describe('Mostrar numeración de páginas en PDFs'),
      invoice_design_id: z.string().optional().describe('ID de plantilla PDF para facturas (usar list_designs para ver opciones)'),
      quote_design_id: z.string().optional().describe('ID de plantilla PDF para presupuestos (usar list_designs para ver opciones)'),
      // Colores
      primary_color: HexColor.optional().describe('Color principal de la empresa en PDFs (formato #RRGGBB)'),
      secondary_color: HexColor.optional().describe('Color secundario de la empresa en PDFs (formato #RRGGBB)'),
      // Textos legales
      invoice_terms: z.string().optional().describe('Términos y condiciones por defecto en facturas'),
      quote_terms: z.string().optional().describe('Términos y condiciones por defecto en presupuestos'),
      invoice_footer: z.string().optional().describe('Pie de página por defecto en facturas'),
      quote_footer: z.string().optional().describe('Pie de página por defecto en presupuestos'),
      // Presupuestos
      show_accept_quote_terms: z.boolean().optional().describe('Mostrar checkbox de aceptación de términos en presupuestos'),
      require_quote_signature: z.boolean().optional().describe('Requerir firma del cliente para aprobar presupuesto'),
      // Email
      pdf_email_attachment: z.boolean().optional().describe('Adjuntar PDF automáticamente al enviar facturas/presupuestos por email'),
      email_from_name: z.string().optional().describe('Nombre del remitente en emails'),
      reply_to_email: z.string().optional().describe('Email de respuesta'),
      reply_to_name: z.string().optional().describe('Nombre de respuesta'),
      bcc_email: z.string().optional().describe('Email en copia oculta en todos los envíos'),
      // Tarifas
      default_task_rate: z.number().optional().describe('Tarifa por hora por defecto para tareas'),
    },
    async (params) => {
      const res = await ninja.get<{ data: Record<string, unknown>[] }>('/companies');
      const company = res.data[0] as { id: string; settings: Record<string, unknown> };

      const { update_products, ...settingsParams } = params;

      // Solo fusionar los campos que realmente se recibieron (excluir undefined)
      const settingsUpdates = Object.fromEntries(
        Object.entries(settingsParams).filter(([, v]) => v !== undefined),
      );

      const body: Record<string, unknown> = {
        settings: { ...company.settings, ...settingsUpdates },
      };
      if (update_products !== undefined) body.update_products = update_products;

      const updated = await ninja.put<{ data: Record<string, unknown> }>(
        `/companies/${company.id}`,
        body,
      );
      return {
        content: [{ type: 'text' as const, text: `Preferencias actualizadas:\n${JSON.stringify(updated.data, null, 2)}` }],
      };
    },
  );

  server.tool(
    'list_designs',
    'Lista las plantillas PDF disponibles en Invoice Ninja con su ID y nombre, para usar en invoice_design_id y quote_design_id',
    {},
    async () => {
      const res = await ninja.get<{ data: Array<{ id: string; name: string; is_deleted?: boolean }> }>('/designs');
      const designs = res.data
        .filter((d) => !d.is_deleted)
        .map((d) => ({ id: d.id, name: d.name }));
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(designs, null, 2) }],
      };
    },
  );
}
