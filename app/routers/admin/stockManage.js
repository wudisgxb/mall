
const stockManage = require('../../controller/admin/stockManage');
const router = new (require('koa-router'))()
// //新增仓库
// router.post('/api/test/admin/stockManage', stockManage.saveStockManage);
//修改仓库商品信息
router.put('/api/test/admin/stockManage', stockManage.updateStockManage);
//根据名字个商品编号查询单个商品的详细信息
router.get('/api/test/admin/stockManage', stockManage.getStockManageOne);
// //根据时间查询所有的进货商品
// router.get('/api/test/admin/stockManageByTime', stockManage.getStockManagesBytime);
//查询进货商品总数量
router.get('/api/test/admin/stockManageByGoodNameSum', stockManage.getStockManagesByGoodSum);
//根据tenantId分页查询所有记录
router.get('/api/test/admin/stockManageByTenantId', stockManage.getStockManagesByTenantId);
//查询tenantId的总记录数
router.get('/api/test/admin/getStockManagesByTenantIdCount', stockManage.getStockManagesByTenantIdCount);
module.exports = router
