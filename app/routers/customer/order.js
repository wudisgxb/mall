let order = require('../../controller/customer/order');

const router = new (require('koa-router'))()

router.get('/api/v3/customer/deal/order', order.getUserDealOrder);

router.post('/api/v3/customer/deal/order', order.saveUserDealOrder);

router.post('/api/v3/customer/eshop/order', order.saveUserEshopOrder);

router.put('/api/v3/customer/eshop/order', order.updateUserEshopOrder);

router.delete('/api/v3/customer/eshop/order', order.deleteUserEshopOrder);

router.get('/api/v3/customer/eshop/order', order.getUserEshopOrder);

module.exports = router
