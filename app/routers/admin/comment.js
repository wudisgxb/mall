

const comment = require('../../controller/admin/comment');
const router = new (require('koa-router'))()
// todo: redirect
router.get('/api/v3/customer/deal/comments/merchant', comment.getCustomerMerchantByTenantId);
router.get('/api/v3/customer/eshop/comments/merchant', comment.getCustomerMerchantByConsigneeId);
router.post('/api/v3/customer/deal/comments/merchant', comment.saveCustomerMerchantByTenantId);
router.post('/api/v3/customer/eshop/comments/merchant', comment.saveCustomerMerchantByConsigneeId);
router.post('/api/v3/customer/deal/comments/food', comment.saveCustomerFoodByTenantId);
router.post('/api/v3/customer/eshop/comments/food', comment.saveCustomerFoodByConsigneeId);
module.exports = router

