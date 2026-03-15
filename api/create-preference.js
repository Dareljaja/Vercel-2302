import { MercadoPagoConfig, Preference } from 'mercadopago';

const accessToken = process.env.MERCADOPAGO_TOKEN;
const client = new MercadoPagoConfig({ accessToken });

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!accessToken) {
    return res.status(500).json({ error: 'Configura MERCADOPAGO_TOKEN en Vercel (o en .env.local para local)' });
  }
  try {
    const input = req.body;
    if (!input.items || !Array.isArray(input.items)) {
      return res.status(400).json({ error: 'No items provided' });
    }

    const items = (input.items || [])
      .filter((item) => item != null)
      .map((item) => ({
        id: String(item.id != null ? item.id : ''),
        title: (item.name ?? 'Producto').toString(),
        description: (item.description ?? '').toString(),
        quantity: Number(item.quantity) || 1,
        unit_price: parseFloat(item.price) || 0,
        currency_id: 'ARS',
        picture_url: (item.image ?? '').toString()
      }));

    const body = {
      items,
      payer: {
        name: input.payer?.name || 'Comprador',
        email: input.payer?.email || ''
      },
      back_urls: {
        success: `${req.headers.origin || 'https://' + req.headers.host}/success.html`,
        failure: `${req.headers.origin || 'https://' + req.headers.host}/failure.html`,
        pending: `${req.headers.origin || 'https://' + req.headers.host}/pending.html`
      },
      payment_methods: {
        installments: 12
      },
      auto_return: 'approved'
    };
    // order_id = id del pedido en tu sistema; Mercado Pago lo devuelve en el pago para el webhook
    if (input.order_id != null && input.order_id !== '') {
      body.external_reference = String(input.order_id);
    }

    const response = await new Preference(client).create({ body });
    res.json({
      success: true,
      preference_id: response.body.id,
      init_point: response.body.init_point,
      sandbox_init_point: response.body.sandbox_init_point
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
}
