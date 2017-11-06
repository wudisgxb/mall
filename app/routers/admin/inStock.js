
const inStock = require('../../controller/admin/inStock');
const router = new (require('koa-router'))()
//新增进库
router.post('/api/test/admin/inStock',inStock.saveInStock)

module.exports = router