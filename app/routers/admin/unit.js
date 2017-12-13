
var unit = require('../../controller/admin/unit');
const router = new (require('koa-router'))()

router.post('/api/test/admin/units', unit.saveAdminMenus);
router.put('/api/test/admin/units', unit.updateAdminMenusById);
router.get('/api/test/admin/units', unit.getAdminMenus);
router.put('/api/test/admin/unitsById', unit.getAdminMenusById);
module.exports = router