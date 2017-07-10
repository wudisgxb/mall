
var db = require('../../db/mysql/index');
var Admins = db.models.Adminer;
const admin = require('../../controller/admin/admin');
const router = new (require('koa-router'))()
    // todo: redirect
    // router.put('/api/v3/admin/adminers',admin.putAdminAdminers);
    // router.post('/api/v3/admin/adminers',admin.saveAdminAdminers);
module.exports = router

