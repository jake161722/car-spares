// Edit these values for your business. Everything else reads from here.
module.exports = {
  port: process.env.PORT || 3000,
  adminKey: process.env.ADMIN_KEY || 'change-me-now',
  shop: {
    name: 'Vaite Car Spares', domain: 'carsparesvaite.co.ke',
    phone: '+254700000000', whatsapp: '254700000000', email: 'info@carsparesvaite.co.ke',
    address: 'Your shop address, Nairobi, Kenya', hours: 'Mon - Sat: 8:00am - 6:00pm',
    paybill: '000000', account: 'YOUR-ACCOUNT'
  },
  baseCurrency: 'KES',
  // Update rates regularly (1 KES = x). Could be fed from an FX API.
  rates: { KES:1, USD:0.0077, EUR:0.0071, GBP:0.0060, UGX:28.3, TZS:20.2, AED:0.0283 },
  shipping: { Kenya:{ KES:0, note:'Free pick-up; Nairobi delivery quoted on WhatsApp' }, international:{ KES:6500, note:'Courier, 5-10 working days' } }
};
