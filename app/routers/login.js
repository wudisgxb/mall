const router = new (rootRequire('koa-router'))()
const Login = rootRequire('app/controller/Login')

router.post('/api/v1/login', Login.login)

module.exports = router