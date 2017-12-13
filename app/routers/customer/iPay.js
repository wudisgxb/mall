// var db = require('../../db/mysql/index');
// var sequelize = require('sequelize');

let iPay = require('../../controller/iPay/ipay');
const router = new (require('koa-router'))()


router.get('/api/test/customer/ipay/alipay', iPay.getIPayAlipayReq);

router.get('/api/test/customer/ipay/wechatpay', iPay.getIPayWechatpayReq);

router.get('/api/test/customer/ipay/wechatpay/redirectUrl', iPay.iPayRedirect);

//回调
router.post('/api/test/ipay/alipay', iPay.alipay);
router.post('/api/test/ipay/wechatPayNotify', iPay.wechatPayNotify);

module.exports = router