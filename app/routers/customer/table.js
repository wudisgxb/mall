const table = require('../../controller/customer/table');

const router = new (require('koa-router'))()

//查看点餐桌状态的
router.get('/api/test/customer/deal/table', table.getUserDealTable);

//查看代售桌状态的
router.get('/api/test/customer/eshop/table', table.getUserEshopTable);

module.exports = router