const businessInfo = Object.freeze({
  brand: Object.freeze({
    mark: 'F',
    name: 'Forno Rosso',
    blurb:
      'Artisanal wood-fired sourdough pizzas crafted with 48-hour fermented dough and imported San Marzano ingredients. Delivered fresh and piping hot.',
  }),
  socialLinks: Object.freeze([
    Object.freeze({ id: 'instagram', label: 'Instagram', href: '#' }),
    Object.freeze({ id: 'facebook', label: 'Facebook', href: '#' }),
    Object.freeze({ id: 'twitter', label: 'Twitter', href: '#' }),
  ]),
  kitchenHours: Object.freeze([
    Object.freeze({ label: 'Monday - Thursday', value: '12:00 PM - 10:00 PM' }),
    Object.freeze({ label: 'Friday - Saturday', value: '12:00 PM - 11:30 PM' }),
    Object.freeze({ label: 'Sunday', value: '1:00 PM - 9:30 PM' }),
  ]),
  location: Object.freeze({
    address: '842 Rione Monti, Sourdough Avenue, Suite 100',
    deliveryPhone: '(555) 392-7677',
    deliveryEmail: 'ciao@fornorosso.pizza',
  }),
  legalLinks: Object.freeze([
    Object.freeze({ id: 'privacy-policy', label: 'Privacy Policy', href: '/pizzeria/privacy-policy' }),
    Object.freeze({ id: 'delivery-terms', label: 'Delivery Terms', href: '/pizzeria/delivery-terms' }),
  ]),
  copyright: '© 2026 Forno Rosso Pizzeria. All rights reserved.',
});

module.exports = businessInfo;
