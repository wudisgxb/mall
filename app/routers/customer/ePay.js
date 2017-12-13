// var db = require('../../db/mysql/index');
var sequelize = require('sequelize');

let ePay = require('../../controller/ePay/ePay');
const router = new (require('koa-router'))()


router.get('/api/test/customer/epay/alipay', ePay.getEPayAlipayReq);

router.get('/api/test/customer/epay/wechatpay', ePay.getEPayWechatpayReq);

router.get('/api/test/customer/epay/wechatpay/redirectUrl', ePay.ePayRedirect);

//回调
router.post('/api/test/epay/alipay', ePay.alipay);
router.post('/api/test/epay/wechatPayNotify', ePay.wechatPayNotify);

//ePay下单
router.post('/api/test/epay/order', ePay.saveOrder);

module.exports = router