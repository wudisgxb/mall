// let db = require('../../db/mysql/index');
// let Admins = db.models.Adminer;
const adminCorresponding = require('../../controller/admin/adminCorresponding');
const router = new (require('koa-router'))()
// todo: redirect
router.post('/api/test/admin/saveAdministration', adminCorresponding.saveAdministration);
router.put('/api/test/admin/updateAdminCorresponding', adminCorresponding.updateAdminCorresponding);
// router.post('/api/test/admin/administration', adminCorresponding.administration);
router.get('/api/test/admin/adminCorresponding', adminCorresponding.getAdminCorresponding);
router.get('/api/test/admin/getThisCompanyStaff', adminCorresponding.getThisCompanyStaff);
router.get('/api/test/admin/getAll', adminCorresponding.getAll);

module.exports = router
