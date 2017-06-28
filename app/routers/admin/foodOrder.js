/**
 * Created by bian on 12/3/15.
 */



var tool = require('../../Tool/tool')
const foodOrder = require('../../controller/admin/foodOrder')
const ApiResult = require('../../db/mongo/ApiResult');
module.exports = (router) => {

    //查询订单
    router.get('/api/v3/admin/foodOrder/query', foodOrder.getAdminFoodOrder);

    router.put('/api/v3/admin/foodOrder/edit/:id', foodOrder.updateAdminFoodOrderByEditId);

    router.delete('/api/v3/admin/foodOrder/:tableId',foodOrder.deleteAdminFoodOrderTableId);
        
};