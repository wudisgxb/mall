
const headquarters = require('../../controller/vip/headquarters');
const router = new (require('koa-router'))()
// todo: redirect
router.post('/api/test/admin/headquarters', headquarters.saveHeadQuarters);
router.get('/api/test/admin/headquarters', headquarters.getHeadQuarters);
// router.get('/api/test/admin/headquartersByHeadquartersId', headquarters.getHeadQuarters);
router.get('/api/test/admin/headquartersByName', headquarters.getHeadQuartersByName);
router.put('/api/test/admin/headquarters', headquarters.updateHeadQuarters);
router.delete('/api/test/admin/headquarters', headquarters.deleteHeadQuarters);
module.exports = router
