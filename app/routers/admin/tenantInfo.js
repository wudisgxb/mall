let tenantInfo = require('../../controller/admin/tenantInfo');

const router = new (require('koa-router'))()

//查询租户基础信息
router.get('/api/v3/admin/deal/tenantInfo', tenantInfo.getTenantInfoByTenantId);
//新增租户信息
router.post('/api/v3/admin/deal/tenantInfo',tenantInfo.saveTenantInfo);
//编辑租户信息
router.put('/api/v3/admin/deal/tenantInfo',tenantInfo.updateTenantInfoByTenantId)

module.exports = router