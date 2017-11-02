let merchantIntegrals = require('../../controller/admin/merchantIntegrals');

const router = new (require('koa-router'))()
router.post('/api/test/admin/merchantIntegrals', merchantIntegrals.saveMerchantIntegrals);
router.get('/api/test/admin/merchantIntegrals', merchantIntegrals.getMerchantIntegrals);
router.get('/api/test/admin/merchantIntegrals', merchantIntegrals.getMerchantIntegrals);
module.exports = router

