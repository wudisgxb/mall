let sequelize = require('sequelize');

let merchant = require('../../controller/admin/merchant');
const router = new (require('koa-router'))()

router.post('/api/test/admin/merchant', merchant.saveAdminMerchant);
router.put('/api/test/admin/merchant', merchant.updateAdminMerchantById);
router.get('/api/test/admin/merchant', merchant.getAdminMerchant);
router.delete('/api/test/admin/merchant', merchant.deleteAdminMerchant);

router.get('/api/test/admin/consignees', merchant.getAdminConsignee);


module.exports = router
