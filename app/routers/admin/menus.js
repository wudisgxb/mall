var sequelize = require('sequelize');

var menus = require('../../controller/admin/menus');
const router = new (require('koa-router'))()

router.post('/api/test/admin/menus', menus.saveAdminMenus);
router.put('/api/test/admin/menus', menus.updateAdminMenusById);
router.get('/api/test/admin/menus', menus.getAdminMenus);
//router.put('/api/v3/admin/menusById', menus.updateAdminMenusBySort);
module.exports = router