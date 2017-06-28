
var sequelize = require('sequelize');

var menus = require('../../controller/admin/menus');

module.exports = (router) => {

    
    router.post('/api/v3/admin/menus/save',  menus.saveAdminMenus);
    router.put('/api/v3/admin/menus/save/:id',  menus.updateAdminMenusById);
    router.get('/api/v3/admin/menus',menus.getAdminMenus);
};