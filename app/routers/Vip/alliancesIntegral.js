let db = require('../../db/mysql/index');
let Admins = db.models.Adminer;
const alliancesIntegral = require('../../controller/vip/alliancesIntegral');
const router = new (require('koa-router'))()
// todo: redirect
router.post('/api/test/admin/alliancesIntegral', alliancesIntegral.saveAlliancesIntegral);
router.get('/api/test/admin/alliancesIntegral', alliancesIntegral.getAlliancesIntegral);
module.exports = router
