var db = require('../../db/mysql/index');
var sequelize = require('sequelize');

let alipay = require('../../controller/alipay/alipay');
const router = new (require('koa-router'))()


router.get('/api/test/customer/deal/alipay/wap', alipay.getUserDealAlipayReq);

router.get('/api/test/customer/eshop/alipay/wap', alipay.getUserEshopAlipayReq);

//回调
router.post('/api/test/alipay', alipay.alipay);

module.exports = router