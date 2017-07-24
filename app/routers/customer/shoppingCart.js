let shoppingCart = require('../../controller/customer/shoppingCart')
const router = new (require('koa-router'))()

//点餐
router.get('/api/test/customer/deal/shoppingCart', shoppingCart.getUserDealShoppingCart);
router.post('/api/test/customer/deal/shoppingCart', shoppingCart.addUserDealShoppingCart);
router.put('/api/test/customer/deal/shoppingCart', shoppingCart.updateUserDealShoppingCart);

//代售
router.get('/api/test/customer/eshop/shoppingCart', shoppingCart.getUserEshopShoppingCart);
router.post('/api/test/customer/eshop/shoppingCart', shoppingCart.addUserEshopShoppingCart);
router.put('/api/test/customer/eshop/shoppingCart', shoppingCart.updateUserEshopShoppingCart);

module.exports = router
