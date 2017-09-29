let vipIntegrals = require('../../controller/vip/vipIntegrals');

const router = new (require('koa-router'))()

router.post('/api/test/admin/vipIntegrals', vipIntegrals.saveVipIntegrals);
router.get('/api/test/admin/vipIntegrals', vipIntegrals.getVipIntegrals);
module.exports = router
