var db = require('../../db/mysql/index');
var sequelize = require('sequelize');

let alipay = require('../../controller/alipay/alipay');
const router = new (require('koa-router'))()


router.get('/api/v3/customer/deal/alipay/wap', alipay.getUserDealAlipayReq);

router.get('/api/v3/customer/eshop/alipay/wap', alipay.getUserEshopAlipayReq);

//回调
router.post('/api/v3/alipay', alipay.alipay);

module.exports = router