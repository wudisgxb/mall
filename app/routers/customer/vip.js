let vip = require('../../controller/customer/vip')

const router = new (require('koa-router'))()

router.get('/api/v2/user/vip/check',vip.checkUserVip);

module.exports = router