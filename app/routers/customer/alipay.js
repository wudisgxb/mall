var db = require('../../db/mysql/index');
var sequelize = require('sequelize');

let alipay = require('../../controller/customer/alipay');
const router = new (require('koa-router'))()


router.get('/api/v3/customer/deal/alipay/wap', alipay.getUserDealAlipayReq);

module.exports = router