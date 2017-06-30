const table = require('../../controller/customer/table');

const router = new (require('koa-router'))()

//查看点餐桌状态的
router.get('/api/v3/customer/deal/table', table.getUserDealTable);

//查看代售桌状态的
router.get('/api/v3/customer/eshop/table', table.getUserEshopTable);

module.exports = router