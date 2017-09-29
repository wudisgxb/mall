let db = require('../../db/mysql/index');
let Admins = db.models.Adminer;
const allianceMerchants = require('../../controller/vip/allianceMerchants');
const router = new (require('koa-router'))()
// todo: redirect
router.post('/api/test/admin/allianceMerchants', allianceMerchants.saveAllianceMerchants);
router.get('/api/test/admin/allianceMerchants', allianceMerchants.getAllianceMerchants);
router.get('/api/test/admin/allianceMerchantsByAllianceId', allianceMerchants.getAllianceMerchantsByAllianceId);
router.put('/api/test/admin/allianceMerchants', allianceMerchants.updateAllianceMerchants);
router.delete('/api/test/admin/allianceMerchants', allianceMerchants.deleteAllianceMerchants);
module.exports = router
