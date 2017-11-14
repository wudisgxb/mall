
const inStock = require('../../controller/admin/inStock');
const router = new (require('koa-router'))()
//新增进库
router.post('/api/test/admin/inStock',inStock.saveInStock)
router.post('/api/test/admin/inStockPatch',inStock.saveInStockPatch)
router.put('/api/test/admin/inStock',inStock.updateInStock)
router.post('/api/test/admin/inStockByWareHouseManages',inStock.saveWareHouseManages)
router.get('/api/test/admin/inStockByName',inStock.getInStockByName)
router.get('/api/test/admin/inStockByTenantId',inStock.getInStockByTenantId)
router.delete('/api/test/admin/inStock',inStock.deleteInStock)

module.exports = router