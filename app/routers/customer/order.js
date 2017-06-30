let order = require('../../controller/customer/order');

const router = new (require('koa-router'))()

router.get('/api/v3/user/order/:TableId', order.getUserOrderByTableId);

router.put('/api/v3/user/order/:TableId', order.updateUserOrderByTableId);
module.exports = router
