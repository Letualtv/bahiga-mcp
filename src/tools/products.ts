import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { NinjaClient } from '../ninja.js';

export function registerProductTools(server: McpServer, ninja: NinjaClient): void {
  server.tool(
    'list_products',
    'Lista todos los productos/servicios disponibles en Invoice Ninja con precio y descripción',
    {},
    async () => {
      const res = await ninja.get<{ data: unknown[] }>('/products?per_page=100');
      return { content: [{ type: 'text' as const, text: JSON.stringify(res.data, null, 2) }] };
    },
  );

  server.tool(
    'create_product',
    'Crea un nuevo producto o servicio en Invoice Ninja',
    {
      product_key: z.string().describe('Nombre del producto/servicio (ej: "Desarrollo chatbot")'),
      notes: z.string().optional().describe('Descripción detallada'),
      cost: z.number().describe('Precio unitario en euros (sin IVA)'),
      tax_name1: z.string().optional().default('IVA').describe('Nombre del impuesto'),
      tax_rate1: z.number().optional().default(21).describe('Porcentaje de IVA (por defecto 21)'),
    },
    async (params) => {
      const res = await ninja.post<{ data: unknown }>('/products', params);
      return { content: [{ type: 'text' as const, text: `Producto creado:\n${JSON.stringify(res.data, null, 2)}` }] };
    },
  );

  server.tool(
    'update_product',
    'Actualiza un producto o servicio existente',
    {
      product_id: z.string().describe('ID del producto a actualizar'),
      product_key: z.string().optional().describe('Nuevo nombre'),
      notes: z.string().optional().describe('Nueva descripción'),
      cost: z.number().optional().describe('Nuevo precio en euros (sin IVA)'),
      tax_rate1: z.number().optional().describe('Nuevo porcentaje de IVA'),
    },
    async ({ product_id, ...fields }) => {
      const res = await ninja.put<{ data: unknown }>(`/products/${product_id}`, fields);
      return { content: [{ type: 'text' as const, text: `Producto actualizado:\n${JSON.stringify(res.data, null, 2)}` }] };
    },
  );

  server.tool(
    'delete_product',
    'Elimina un producto o servicio de Invoice Ninja',
    { product_id: z.string().describe('ID del producto a eliminar') },
    async ({ product_id }) => {
      await ninja.delete(`/products/${product_id}`);
      return { content: [{ type: 'text' as const, text: `Producto ${product_id} eliminado correctamente.` }] };
    },
  );
}
