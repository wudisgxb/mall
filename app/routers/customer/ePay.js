var db = require('../../db/mysql/index');
var sequelize = require('sequelize');

let ePay = require('../../controller/ePay/ePay');
const router = new (require('koa-router'))()


router.get('/api/test/customer/ePay/alipay', ePay.getEPayAlipayReq);

router.get('/api/test/customer/ePay/wechatpay', ePay.getEPayWechatpayReq);

router.get('/api/test/customer/ePay/wechatpay/redirectUrl', ePay.ePayRedirect);

//回调
router.post('/api/test/ePay/alipay', ePay.alipay);
router.post('/api/test/ePay/wechatPayNotify', ePay.wechatPayNotify);

module.exports = router