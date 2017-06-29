var db = require('../../db/mysql/index');
var sequelize = require('sequelize');

let foods = require('../../controller/customer/foods');
const router = new (require('koa-router'))()


router.get('/api/v3/customer/deal/menu', foods.getUserMenus);
router.get('/api/v3/customer/eshop/menu', foods.getEshopUserMenus);
router.post('/api/v3/user/rating', foods.saveUserReting);

module.exports = router