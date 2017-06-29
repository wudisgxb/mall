

let sms = require('../../controller/customer/sms')
const router = new (require('koa-router'))()

    

router.put('/api/v3/sms/send/verificationCode/:phone', sms.pdateUserSendByPhone);

router.post('/api/v3/sms/confirm/verificationCode/:phone/:code', sms.updateUserConfirmByPhoneOrCode);

module.exports = router
