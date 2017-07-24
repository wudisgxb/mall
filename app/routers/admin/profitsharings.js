var db = require('../../db/mysql/index');
var profitsharings = require('../../controller/admin/profitsharings')

const router = new (require('koa-router'))()
router.get('/api/test/admin/allConsigneeIds',profitsharings.getAdminProfitsharingsByTenantId);
module.exports = router
