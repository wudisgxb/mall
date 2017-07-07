//const router = new (require('koa-router'))()
const Oauth = require('../../controller/wechatPay/wechatOauth')
const router = new (require('koa-router'))()


router.get('/api/v3/customer/deal/wechatpay/redirctUrl', Oauth.userDealRedirect)
// router.get('/api/v2/oauth/getUser', Oauth.getUser)
router.get('/api/v3/customer/eshop/wechatpay/redirctUrl', Oauth.userEshopRedirect)

router.get('/api/v3/customer/deal/wechatpay/wap', Oauth.getUserDealWechatPayParams)

router.get('/api/v3/customer/eshop/wechatpay/wap', Oauth.getUserEshopWechatPayParams)


//获取openid
router.get('/api/v3/openId', Oauth.getOpenId)

router.post('/api/v3/wechatPayNotify', Oauth.wechatPayNotify)

//router.get('/api/v3/transfers', Oauth.transfers)

//router.get('/api/v3/queryTransferInfo', Oauth.queryTransferInfo)

module.exports = router