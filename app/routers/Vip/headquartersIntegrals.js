let headquartersIntegrals = require('../../controller/Vip/headquartersIntegrals');

const router = new (require('koa-router'))()


router.get('/api/test/admin/headquartersIntegrals', headquartersIntegrals.getHeadquartersIntegrals);
module.exports = router
