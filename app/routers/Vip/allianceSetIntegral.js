let db = require('../../db/mysql/index');
let Admins = db.models.Adminer;
const allianceSetIntegral = require('../../controller/vip/allianceSetIntegral');
const router = new (require('koa-router'))()
// todo: redirect
router.post('/api/test/admin/allianceSetIntegral', allianceSetIntegral.saveAllianceSetIntegral);
router.put('/api/test/admin/allianceSetIntegral', allianceSetIntegral.updateAllianceSetIntegral);
router.get('/api/test/admin/allianceSetIntegral', allianceSetIntegral.getAllianceSetIntegral);

module.exports = router
