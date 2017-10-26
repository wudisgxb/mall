//const router = new (require('koa-router'))()
const Oauth = require('../../controller/wechatPay/wechatOauth')
const router = new (require('koa-router'))()


router.get('/api/test/admin/deal/wechatpay/refund', Oauth.dealWechatRefund)

router.get('/api/test/admin/eshop/wechatpay/refund', Oauth.eshopWechatRefund)

router.post('/api/test/admin/eshop/wechatpay/reimburse', Oauth.reimburse.bind(Oauth))




module.exports = router