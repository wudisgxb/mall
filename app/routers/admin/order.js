/**
 * Created by bian on 12/3/15.
 */



var tool = require('../../Tool/tool')
const order = require('../../controller/admin/order')
const ApiResult = require('../../db/mongo/ApiResult');
const router = new (require('koa-router'))()

//查询订单
router.get('/api/v3/admin/order/query', order.getAdminOrder);

router.put('/api/v3/admin/order/edit/:id', order.updateAdminOrderByEditId);

router.delete('/api/v3/admin/order/:tableId',order.deleteAdminOrderTableId);
module.exports = router