var sequelize = require('sequelize');

var unit = require('../../controller/admin/unit');
const router = new (require('koa-router'))()

router.post('/api/test/admin/units', unit.saveAdminMenus);
router.put('/api/test/admin/units', unit.updateAdminMenusById);
router.get('/api/test/admin/units', unit.getAdminMenus);
//router.put('/api/v3/admin/menusById', menus.updateAdminMenusBySort);
module.exports = router