/**
 * Created by bian on 12/3/15.
 */
var tool = require('../../Tool/tool')
const order = require('../../controller/admin/order')
const orderCustomer = require('../../controller/customer/order')
const ApiResult = require('../../db/mongo/ApiResult');
const router = new (require('koa-router'))()

//查询订单
// router.get('/api/v3/admin/order', order.getAdminOrder);

// router.put('/api/v3/admin/order/edit/:id', order.updateAdminOrderByEditId);
//
// router.delete('/api/v3/admin/order/:tableId',order.deleteAdminOrderTableId);
router.put('/api/test/admin/order',orderCustomer.updateUserEshopOrder)
router.delete('/api/test/admin/deal/order',order.deleteAdminOrderTenantId);
router.delete('/api/test/admin/eshop/order',order.deleteAdminOrderConsigneeId);
router.get('/api/test/admin/order',order.getAdminOrder);
router.get('/api/test/admin/orderByCount',order.getAdminOrderByCount);

router.get('/api/test/admin/orderByCountis',order.getAdminOrderByCountis);


//router.post('/api/test/admin/order',order.saveAdminOrder);

module.exports = router