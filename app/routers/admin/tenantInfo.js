let tenantInfo = require('../../controller/admin/tenantInfo');

const router = new (require('koa-router'))()

//查询租户基础信息
router.get('/api/v3/admin/deal/tenantInfo', tenantInfo.getTenantInfoByTenantId);

module.exports = router