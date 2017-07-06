//const router = new (require('koa-router'))()
const Oauth = require('../../controller/wechatPay/wechatOauth')
const router = new (require('koa-router'))()


router.get('/api/v3/admin/deal/wechatpay/refund', Oauth.dealWechatRefund)

router.get('/api/v3/admin/eshop/wechatpay/refund', Oauth.eshopWechatRefund)



module.exports = router