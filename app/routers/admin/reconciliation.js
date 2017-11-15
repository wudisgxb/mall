const reconciliation = require('../../controller/admin/reconciliation');
const router = new (require('koa-router'))()

router.get("/api/test/admin/GoodsWriteOff",reconciliation.getGoodsWriteOff);
router.get("/api/test/admin/revenueReceived",reconciliation.getPracticalWriteOff);
router.get("/api/test/customer/eshop/ordergoodsAbc",reconciliation.getPractical);

module.exports = router