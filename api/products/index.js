export default function handler(req, res) {
  const products = [
    {
      id: 'vivant-crema-rosa',
      name: 'Vivant Crema Rosa',
      price: 15000,
      description: 'Crema premium para el cuidado intensivo de la piel.',
      image: 'assets/2302-pie-de-pagina.png'
    },
    {
      id: 'serum-evolucion',
      name: 'Serum Evolución',
      price: 18500,
      description: 'Fórmula avanzada para hidratación profunda.',
      image: 'assets/2302-pie-de-pagina.png'
    },
    {
      id: 'kit-duo-premium',
      name: 'Kit Dúo Premium',
      price: 31000,
      description: 'El set completo para tu rutina diaria.',
      image: 'assets/2302-pie-de-pagina.png'
    }
  ];

  res.status(200).json(products);
}