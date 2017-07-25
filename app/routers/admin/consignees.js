
var db = require('../../db/mysql/index');
//var Admins = db.models.Adminer;
const consignees = require('../../controller/admin/consignees');
const router = new (require('koa-router'))()
// todo: redirect
router.get('/api/test/admin/consignee',consignees.getAdminConsignees);
router.post('/api/v3/admin/consignee',consignees.saveAdminConsignees);
router.put('/api/test/admin/consignee',consignees.updateAdminConsignees);
//router.delete('/api/v3/admin/consignee',consignees.deleteAdminConsignees);
module.exports = router
