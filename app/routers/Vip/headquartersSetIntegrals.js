let db = require('../../db/mysql/index');
let Admins = db.models.Adminer;
const headquartersSetIntegrals = require('../../controller/vip/headquartersSetIntegrals');
const router = new (require('koa-router'))()
// todo: redirect
router.post('/api/test/admin/headquartersSetIntegrals', headquartersSetIntegrals.saveHeadQuartersSetIntegrals);
router.get('/api/test/admin/headquartersSetIntegrals', headquartersSetIntegrals.getHeadquartersSetIntegrals);
// // router.get('/api/test/admin/headquarterss', headquarters.getHeadQuartersId);
// router.get('/api/test/admin/headquartersByName', headquartersSetIntegrals.getHeadQuartersByName);
router.put('/api/test/admin/headquartersSetIntegrals', headquartersSetIntegrals.updateHeadQuartersSetIntegrals);
// router.delete('/api/test/admin/headquarters', headquartersSetIntegrals.deleteHeadQuarters);
module.exports = router
