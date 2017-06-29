let foodOrder = require('../../controller/customer/foodsOrder');


module.exports = (router) => {

    router.get('/api/v3/user/foodOrder/:TableId', foodOrder.getUserfoodOrderByTableId);
    
    router.put('/api/v3/user/foodOrder/:TableId', foodOrder.updateUserfoodOrderByTableId);

};
