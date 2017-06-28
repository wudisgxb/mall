let foodOrder = require('../../controller/customer/foodsOrder');


module.exports = (router) => {

    router.get('/api/v2/user/foodOrder/:TableId', foodOrder.getUserfoodOrderByTableId);
    
    router.put('/api/v2/user/foodOrder/:TableId', foodOrder.updateUserfoodOrderByTableId);

};
