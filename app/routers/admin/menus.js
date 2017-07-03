var sequelize = require('sequelize');

var menus = require('../../controller/admin/menus');
const router = new (require('koa-router'))()

router.post('/api/v3/admin/menus', menus.saveAdminMenus);
router.put('/api/v3/admin/menus', menus.updateAdminMenusById);
router.get('/api/v3/admin/menus', menus.getAdminMenus);
module.exports = router