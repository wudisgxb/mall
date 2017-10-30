let tenantInfo = require('../../controller/admin/tenantInfo');

const router = new (require('koa-router'))()

//查询租户基础信息
router.get('/api/test/customer/deal/tenantInfo', tenantInfo.getTenantInfoByTenantId);
router.get('/api/test/customer/eshop/tenantInfo', tenantInfo.getTenantInfoByTenantId);
router.get('/api/test/customer/eshop/bill', tenantInfo.getTenantInfoByBill);
router.post('/api/test/customer/eshop/saveorderGood', tenantInfo.saveorderGood)

module.exports = router