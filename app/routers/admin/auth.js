
var db = require('../../db/mysql/index');
var Admins = db.models.Adminer;
const auth = require('../../controller/admin/auth');
const router = new (require('koa-router'))()
    // todo: redirect
    router.get('/api/v3/admin/Login',auth.getAdminLoginUser);
    router.post('/api/v3/admin/Login',auth.getadminLong);
module.exports = router

