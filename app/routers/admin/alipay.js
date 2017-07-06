var db = require('../../db/mysql/index');
var sequelize = require('sequelize');

let alipay = require('../../controller/alipay/alipay');
const router = new (require('koa-router'))()


router.post('/api/v3/admin/deal/alipay/refund', alipay.dealAlipayRefund);

router.post('/api/v3/admin/eshop/alipay/refund', alipay.eshopAlipayRefund);

module.exports = router