/**
 * Webhook de Mercado Pago: cuando un pago se aprueba, actualiza el pedido en Supabase a "pagado".
 * Configura en tu cuenta MP: Integraciones > Webhooks > URL: https://tu-dominio.vercel.app/api/webhook-mercadopago
 * Eventos: pagos (payment).
 * Verificación de origen con x-signature y MERCADOPAGO_WEBHOOK_SECRET.
 */
import crypto from 'crypto';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { createClient } from '@supabase/supabase-js';

const accessToken = process.env.MERCADOPAGO_TOKEN;
const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET || '';
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function getSupabase() {
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey, { auth: { autoRefreshToken: false, persistSession: false } });
}

/** Verifica la firma x-signature de Mercado Pago (HMAC SHA256). Devuelve true si es válida o si no hay secret. */
function verifyWebhookSignature(req, id) {
  if (!webhookSecret) return true;
  const xSignature = req.headers['x-signature'] || req.headers['X-Signature'];
  const xRequestId = req.headers['x-request-id'] || req.headers['X-Request-Id'];
  if (!xSignature || !xRequestId) {
    console.warn('Webhook MP: falta x-signature o x-request-id');
    return false;
  }
  let ts = '';
  let hash = '';
  const parts = xSignature.split(',');
  for (const part of parts) {
    const [key, value] = part.split('=').map((s) => s.trim());
    if (key === 'ts') ts = value || '';
    else if (key === 'v1') hash = value || '';
  }
  if (!ts || !hash) {
    console.warn('Webhook MP: x-signature sin ts o v1');
    return false;
  }
  const dataIdLower = String(id || '').toLowerCase();
  const manifest = `id:${dataIdLower};request-id:${xRequestId};ts:${ts};`;
  const computed = crypto.createHmac('sha256', webhookSecret).update(manifest).digest('hex');
  return computed === hash;
}

export default async function handler(req, res) {
  const isPost = req.method === 'POST';
  const isGet = req.method === 'GET';
  if (!isPost && !isGet) {
    return res.status(405).send('Method not allowed');
  }

  let topic = req.query?.topic || req.body?.topic;
  let id = req.query?.id ?? req.query?.['data.id'] ?? req.body?.data?.id ?? req.body?.id;

  if (isPost && !id && typeof req.body === 'string') {
    try {
      const parsed = new URLSearchParams(req.body);
      topic = topic || parsed.get('topic');
      id = id || parsed.get('id') || parsed.get('data.id');
    } catch (_) {}
  }

  if (!id) {
    return res.status(400).send('Missing payment id');
  }

  if (topic !== 'payment') {
    return res.status(200).send('OK');
  }

  if (webhookSecret && !verifyWebhookSignature(req, id)) {
    console.warn('Webhook MP: firma inválida, se ignora la notificación');
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
