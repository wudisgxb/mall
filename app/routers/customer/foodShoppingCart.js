
let foodShoppingCart = require('../../controller/customer/foodShoppingCart')

module.exports = (router) => {

    router.get('/api/v2/user/foodShoppingCart/:TableId', foodShoppingCart.getUserfoodShoppingCartByTableId);
    router.post('/api/v2/user/foodShoppingCart/add/:id', foodShoppingCart.updateUserfoodShoppingCartAddById);
    router.post('/api/v2/user/foodShoppingCart/edit/:id', foodShoppingCart.updateUserfoodShoppingCartEditById);

};
