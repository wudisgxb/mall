// var db = require('../../db/mysql/index');
// var Admins = db.models.Adminer;
const auth = require('../../controller/admin/auth');
const Oauth = require('../../controller/wechatPay/wechatOauth')
const router = new (require('koa-router'))()
// todo: redirect
router.get('/api/test/admin/Login', auth.getAdminLoginUser);
router.post('/api/test/admin/Login', auth.getadminLong);
router.post('/api/test/admin/bindOpenId', auth.bindOpenId);
//通过code找租户，可能是数组
router.get('/api/test/admin/tenantIds', Oauth.getTenantIdsByCode)
module.exports = router

