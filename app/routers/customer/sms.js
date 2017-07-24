let sms = require('../../controller/customer/sms')
const router = new (require('koa-router'))()


router.get('/api/test/customer/deal/smscode', sms.getDealSmscode);

router.get('/api/test/customer/eshop/smscode', sms.getDealSmscode);

router.post('/api/test/customer/deal/smscode', sms.dealVerifyCode);

router.post('/api/test/customer/eshop/smscode', sms.dealVerifyCode);

module.exports = router