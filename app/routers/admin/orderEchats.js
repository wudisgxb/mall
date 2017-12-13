
const orderEchats = require('../../controller/admin/orderEchats');
const router = new (require('koa-router'))()
// todo: redirect
router.post('/api/test/admin/PaymentHistory', orderEchats.getOrderEchats);

module.exports = router
