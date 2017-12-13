
const HotSaleFood = require('../../controller/admin/HotSaleFood');
const router = new (require('koa-router'))()
// todo: redirect
router.post('/api/test/admin/HostSaleFood', HotSaleFood.saveHostSaleFood);
module.exports = router