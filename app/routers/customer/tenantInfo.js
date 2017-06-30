let tenantInfo = require('../../controller/admin/tenantInfo');

const router = new (require('koa-router'))()

//查询租户基础信息
router.get('/api/v3/customer/deal/tenantInfo', tenantInfo.getTenantInfoByTenantId);
router.get('/api/v3/customer/eshop/tenantInfo', tenantInfo.getTenantInfoByTenantId);

module.exports = router