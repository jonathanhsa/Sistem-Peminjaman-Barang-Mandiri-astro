import type { APIRoute } from 'astro';
import { db, schema } from '../../../db';
import { eq } from 'drizzle-orm';

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const code = (url.searchParams.get('code') || '').trim();

  if (!code) {
    return new Response(JSON.stringify({ message: 'Parameter kode barang wajib diberikan.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const item = await db
    .select()
    .from(schema.items)
    .where(eq(schema.items.itemCode, code.toUpperCase()))
    .get();

  if (!item) {
    return new Response(
      JSON.stringify({ message: 'Barang dengan kode tersebut tidak ditemukan dalam inventaris.' }),
      {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  const isAvailable = item.status === 'available' && item.stock > 0;

  return new Response(
    JSON.stringify({
      id: item.id,
      item_code: item.itemCode,
      name: item.name,
      category: item.category,
      stock: item.stock,
      status: item.status,
      is_available: isAvailable,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
};
