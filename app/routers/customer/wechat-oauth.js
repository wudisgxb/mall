//const router = new (require('koa-router'))()
const Oauth = require('../../controller/wechatPay/wechatOauth')
const router = new (require('koa-router'))()

//红包节获取用户头像，openId
router.get('/api/test/customer/wechatInfo', Oauth.getWechatInfo)

router.get('/api/test/customer/deal/wechatpay/redirectUrl', Oauth.userDealRedirect)
// router.get('/api/v2/oauth/getUser', Oauth.getUser)
router.get('/api/test/customer/eshop/wechatpay/redirectUrl', Oauth.userEshopRedirect)

router.get('/api/test/customer/eshop/fetch-openid/redirectUrl', Oauth.userEshopOpenIdRedirect);

router.get('/api/test/customer/deal/wechatpay/wap', Oauth.getUserDealWechatPayParams)

router.get('/api/test/customer/eshop/wechatpay/wap', Oauth.getUserEshopWechatPayParams)

//获取openid
router.get('/api/test/customer/eshop/fetch-openid/wap', Oauth.getOpenId)

//通过code找租户，可能是数组
router.get('/api/test/customer/eshop/tenantIds', Oauth.getTenantIdsByCode)

router.post('/api/test/wechatPayNotify', Oauth.wechatPayNotify)

router.put('/api/test/customer/eshop/onlinePayment', Oauth.onlinePayment.bind(Oauth));

// router.post('/api/test/customer/eshop/onlinePaymentCallback', Oauth.onlinePaymentCallback);

// router.get('/api/test/admin/eshop/onlinePayment', Oauth.getOnlinePayment);
//
// router.put('/api/test/admin/eshop/onlinePayment', Oauth.onlinePaymentByCarryOut);


//router.get('/api/v3/transfers', Oauth.transfers)

//router.get('/api/v3/queryTransferInfo', Oauth.queryTransferInfo)

module.exports = router
