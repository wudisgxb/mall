
const allianceHeadquarters = require('../../controller/vip/allianceHeadquarters');
const router = new (require('koa-router'))()
// todo: redirect
router.post('/api/test/admin/allianceHeadquarters', allianceHeadquarters.saveAllianceHeadquarters);
router.get('/api/test/admin/allianceHeadquarters', allianceHeadquarters.getAllianceHeadquarters);
router.put('/api/test/admin/allianceHeadquarters', allianceHeadquarters.updateAllianceHeadquarters);
router.delete('/api/test/admin/allianceHeadquarters', allianceHeadquarters.deleteAllianceHeadquarters);
router.get('/api/test/admin/allianceHeadquartersByHeadquartersId', allianceHeadquarters.getAllianceHeadquartersByheadquartersId);
router.get('/api/test/admin/getMerchant', allianceHeadquarters.getMerchant);


module.exports = router
