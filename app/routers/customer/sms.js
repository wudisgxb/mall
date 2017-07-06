let sms = require('../../controller/customer/sms')
const router = new (require('koa-router'))()


router.get('/api/v3/customer/deal/smscode', sms.updateUserSendByPhone);

router.post('/api/v3/customer/deal/smscode', sms.updateUserConfirmByPhoneOrCode);

module.exports = router