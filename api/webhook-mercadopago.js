/**
 * Webhook de Mercado Pago: cuando un pago se aprueba, actualiza el pedido en Supabase a "pagado".
 * Configura en tu cuenta MP: Integraciones > Webhooks > URL: https://tu-dominio.vercel.app/api/webhook-mercadopago
 * Eventos: pagos (payment).
 */
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { createClient } from '@supabase/supabase-js';

const accessToken = process.env.MERCADOPAGO_TOKEN;
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function getSupabase() {
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey, { auth: { autoRefreshToken: false, persistSession: false } });
}

export default async function handler(req, res) {
  // Mercado Pago envía por POST (body) o a veces por GET (query): topic e id (id del pago)
  const isPost = req.method === 'POST';
  const isGet = req.method === 'GET';
  if (!isPost && !isGet) {
    return res.status(405).send('Method not allowed');
  }

  let topic = req.query?.topic || req.body?.topic;
  let id = req.query?.id ?? req.body?.data?.id ?? req.body?.id;

  if (isPost && !id && typeof req.body === 'string') {
    try {
      const parsed = new URLSearchParams(req.body);
      topic = topic || parsed.get('topic');
      id = id || parsed.get('id');
    } catch (_) {}
  }

  if (!id) {
    return res.status(400).send('Missing payment id');
  }

  if (topic !== 'payment') {
    return res.status(200).send('OK');
  }

  if (!accessToken) {
    console.error('Webhook MP: MERCADOPAGO_TOKEN no configurado');
    return res.status(200).send('OK');
  }

  const client = new MercadoPagoConfig({ accessToken });
  const paymentClient = new Payment(client);

  try {
    const paymentRes = await paymentClient.get({ id: String(id) });
    const payment = paymentRes?.body || paymentRes;

    if (!payment) {
      console.error('Webhook MP: no se pudo obtener el pago', id);
      return res.status(200).send('OK');
    }

    const status = (payment.status || '').toLowerCase();
    if (status !== 'approved') {
      return res.status(200).send('OK');
    }

    const externalRef = payment.external_reference || payment.external_reference_id;
    if (!externalRef) {
      console.warn('Webhook MP: pago sin external_reference', id);
      return res.status(200).send('OK');
    }

    const orderId = String(externalRef).trim();
    const supabase = getSupabase();
    if (!supabase) {
      console.error('Webhook MP: Supabase no configurado');
      return res.status(200).send('OK');
    }

    const { error } = await supabase
      .from('pedidos')
      .update({ estado: 'pagado' })
      .eq('id', orderId);

    if (error) {
      console.error('Webhook MP: error al actualizar pedido', orderId, error);
    } else {
      console.log('Webhook MP: pedido', orderId, 'marcado como pagado');
    }
  } catch (err) {
    console.error('Webhook MP error:', err);
  }

  return res.status(200).send('OK');
}
