let foodOrder = require('../../controller/customer/foodsOrder');

const router = new (require('koa-router'))()

router.get('/api/v3/user/foodOrder/:TableId', foodOrder.getUserfoodOrderByTableId);

router.put('/api/v3/user/foodOrder/:TableId', foodOrder.updateUserfoodOrderByTableId);
module.exports = router
