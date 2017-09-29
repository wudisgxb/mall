let merchantIntegrals = require('../../controller/Vip/merchantIntegrals');

const router = new (require('koa-router'))()


router.get('/api/test/admin/merchantIntegralsByTenantId', merchantIntegrals.getMerchantIntegrals);
module.exports = router