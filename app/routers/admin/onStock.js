const onStock = require('../../controller/admin/onStock');
const router = new (require('koa-router'))()
//新增进库
router.post('/api/test/admin/onStock',onStock.saveOnStock)
// router.post('/api/test/admin/onStockByWareHouseManages',inStonStockock.saveWareHouseManages)
router.get('/api/test/admin/onStock',onStock.getOnStock)
router.put('/api/test/admin/onStockByTenantId',onStock.updateFoodsNumber)

module.exports = router
