const router = new (rootRequire('koa-router'))()
const SMS = rootRequire('app/controller/SMSController')

router.get('/ap1/v1/sms', SMS.sendCode)

module.exports = router