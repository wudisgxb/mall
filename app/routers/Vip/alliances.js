let db = require('../../db/mysql/index');
let Admins = db.models.Adminer;
const alliances = require('../../controller/vip/alliances');
const router = new (require('koa-router'))()
// todo: redirect
router.post('/api/test/admin/alliances', alliances.saveAlliances);
router.get('/api/test/admin/alliances', alliances.getAlliances);
router.get('/api/test/admin/getAlliancesByName', alliances.getAlliancesByName);
router.put('/api/test/admin/alliances', alliances.updateAlliances);
router.delete('/api/test/admin/alliances', alliances.deleteAlliances);
module.exports = router
