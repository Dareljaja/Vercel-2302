import { MercadoPagoConfig, Preference } from 'mercadopago';

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_TOKEN
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!process.env.MERCADOPAGO_TOKEN) {
    return res.status(500).json({ error: 'Configura MERCADOPAGO_TOKEN en Vercel' });
  }
  try {
    const input = req.body;
    if (!input.items || !Array.isArray(input.items)) {
      return res.status(400).json({ error: 'No items provided' });
    }

    const items = input.items.map(item => ({
      id: item.id,
      title: item.name,
      description: item.description || '',
      quantity: item.quantity,
      unit_price: parseFloat(item.price),
      currency_id: 'ARS',
      picture_url: item.image || ''
    }));

    const preference = new Preference(client).create({
      body: {
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
        }
      }
    });

    const response = await preference;
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
