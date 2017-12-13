
const allianceMerchants = require('../../controller/vip/allianceMerchants');
const router = new (require('koa-router'))()
// todo: redirect
router.post('/api/test/admin/allianceMerchants', allianceMerchants.saveAllianceMerchants);
// router.post('/api/test/admin/allianceMerchantsBytenantId', allianceMerchants.saveAllianceMerchantsBytenantId);
router.get('/api/test/admin/allianceMerchants', allianceMerchants.getAllianceMerchants);
router.get('/api/test/admin/allianceMerchantsByAllianceId', allianceMerchants.getAllianceMerchantsByAllianceId);
router.put('/api/test/admin/allianceMerchants', allianceMerchants.updateAllianceMerchants);
router.delete('/api/test/admin/allianceMerchants', allianceMerchants.deleteAllianceMerchants);
module.exports = router
