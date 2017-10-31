 let vip = require('../../controller/customer/vip')

const router = new (require('koa-router'))()

router.get('/api/test/user/vip/check',vip.checkUserVip);
router.get('/api/test/customer/deal/vip',vip.checkUserVip);
router.get('/api/test/customer/eshop/check',vip.checkUserVip);

module.exports = router