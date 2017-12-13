
var profitsharings = require('../../controller/admin/profitsharings')

const router = new (require('koa-router'))()
router.get('/api/test/admin/allConsigneeIds',profitsharings.getAdminProfitsharingsByTenantId);
router.post('/api/test/admin/profitsharings',profitsharings.saveAdminProfitsharings);
router.put('/api/test/admin/profitsharings',profitsharings.updateAdminProfitsharings);
router.delete('/api/test/admin/profitsharings',profitsharings.deleteAdminProfitsharings);
module.exports = router
