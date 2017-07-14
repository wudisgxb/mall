let sequelize = require('sequelize');

let merchant = require('../../controller/admin/merchant');
const router = new (require('koa-router'))()

router.post('/api/v3/admin/merchant', merchant.saveAdminMerchant);
router.put('/api/v3/admin/merchant', merchant.updateAdminMerchantById);
router.get('/api/v3/admin/merchant', merchant.getAdminMerchant);
router.delete('/api/v3/admin/merchant', merchant.deleteAdminMerchant);

router.get('/api/v3/admin/consignees', merchant.getAdminConsignee);


module.exports = router
