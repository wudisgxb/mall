let sms = require('../../controller/customer/sms')
const router = new (require('koa-router'))()


router.get('/api/v3/customer/deal/smscode', sms.getDealSmscode);

router.get('/api/v3/customer/eshop/smscode', sms.getDealSmscode);

router.post('/api/v3/customer/deal/smscode', sms.dealVerifyCode);

router.post('/api/v3/customer/eshop/smscode', sms.dealVerifyCode);

module.exports = router