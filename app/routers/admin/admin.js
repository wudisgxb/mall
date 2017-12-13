
// let db = require('../../db/mysql/index');
// let Admins = db.models.Adminer;
const admin = require('../../controller/admin/admin');
const router = new (require('koa-router'))()
// todo: redirect
router.post('/api/test/admin/register', admin.register);
router.get('/api/test/admin/tenant', admin.getAdminAllTenantId);
router.post('/api/test/admin/roleRegister', admin.roleRegister);
router.put('/api/test/admin/roleRegister', admin.putAdmin);
router.put('/api/test/admin/putRegister', admin.putAdmins);
module.exports = router
