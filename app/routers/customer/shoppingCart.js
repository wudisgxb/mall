let shoppingCart = require('../../controller/customer/shoppingCart')
const router = new (require('koa-router'))()

//点餐
router.get('/api/v3/customer/deal/shoppingCart', shoppingCart.getUserDealShoppingCart);
router.post('/api/v3/customer/deal/shoppingCart', shoppingCart.addUserDealShoppingCart);
router.put('/api/v3/customer/deal/shoppingCart', shoppingCart.updateUserDealShoppingCart);

//代售
router.get('/api/v3/customer/eshop/shoppingCart', shoppingCart.getUserEshopShoppingCart);
router.post('/api/v3/customer/eshop/shoppingCart', shoppingCart.addUserEshopShoppingCart);
router.put('/api/v3/customer/eshop/shoppingCart', shoppingCart.updateUserEshopShoppingCart);

module.exports = router
