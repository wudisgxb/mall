let vip = require('../../controller/customer/vip')

const router = new (require('koa-router'))()

router.get('/api/v3/user/vip/check',vip.checkUserVip);

module.exports = router