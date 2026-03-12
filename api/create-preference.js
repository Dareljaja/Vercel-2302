import { MercadoPagoConfig, Preference } from 'mercadopago';
import { writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new MercadoPagoConfig({ 
  accessToken: process.env.MERCADOPAGO_TOKEN || 'APP_USR-2903382194009460-030714-7875c0826c119a82faa21f70622d091d-164955903',
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
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
          success: `${req.headers.host}/success.html`,
          failure: `${req.headers.host}/failure.html`,
          pending: `${req.headers.host}/pending.html`
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
