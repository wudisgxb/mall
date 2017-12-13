/**
 * Created by bian on 12/3/15.
 */

const order = require('../../controller/admin/order')
const orderCustomer = require('../../controller/customer/order')

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
router.get('/api/test/admin/orderByTrade_no',order.getAdminOrderByTradeNo);
router.get('/api/test/admin/orderByCount',order.getAdminOrderByCount);
router.get('/api/test/admin/orderByLimit',order.getAllAdminOrderByLimit);
router.put('/api/test/admin/orderByStatus',order.updateAdminOrderByStatus);
router.put('/api/test/admin/orderByDeliveryTime',order.updateAdminOrderByDeliveryTime);
router.put('/api/test/admin/orderByByzType',order.updateAdminOrderByBizType);
router.post('/api/test/admin/orderByTime',order.postAdminOrderTime);
router.post('/api/test/admin/orderByFoodName',order.postAdminOrderFoodName);

//router.post('/api/test/admin/order',order.saveAdminOrder);

module.exports = router