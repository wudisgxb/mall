const router = new (rootRequire('koa-router'))()
const Location = require('../controller/Location')


router.get('/api/v1/location', Location.find)


module.exports = router