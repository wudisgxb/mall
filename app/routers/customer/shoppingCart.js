let shoppingCart = require('../../controller/customer/shoppingCart')
const router = new (require('koa-router'))()

router.get('/api/v3/customer/deal/shoppingCart/:tenantId/:tableName', shoppingCart.getUserShoppingCart);
router.post('/api/v3/user/shoppingCart/add/:id', shoppingCart.updateUserShoppingCartAddById);
router.post('/api/v3/user/shoppingCart/edit/:id', shoppingCart.updateUserShoppingCartEditById);

module.exports = router
