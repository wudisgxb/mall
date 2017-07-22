var db = require('../../db/mysql/index');
var Admins = db.models.Adminer;
const orderEchats = require('../../controller/admin/orderEchats');
const router = new (require('koa-router'))()
// todo: redirect
router.post('/api/v3/admin/PaymentHistory', orderEchats.getOrderEchats);

module.exports = router
