let foodShoppingCart = require('../../controller/customer/foodShoppingCart')
const router = new (require('koa-router'))()

router.get('/api/v3/user/foodShoppingCart/:TableId', foodShoppingCart.getUserfoodShoppingCartByTableId);
router.post('/api/v3/user/foodShoppingCart/add/:id', foodShoppingCart.updateUserfoodShoppingCartAddById);
router.post('/api/v3/user/foodShoppingCart/edit/:id', foodShoppingCart.updateUserfoodShoppingCartEditById);

module.exports = router
