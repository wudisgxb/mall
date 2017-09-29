let merchantIntegrals = require('../../controller/admin/merchantIntegrals');

const router = new (require('koa-router'))()


router.get('/api/test/admin/merchantIntegrals', merchantIntegrals.getMerchantIntegrals);
module.exports = router

