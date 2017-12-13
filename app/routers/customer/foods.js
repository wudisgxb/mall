// var db = require('../../db/mysql/index');
// var sequelize = require('sequelize');

let foods = require('../../controller/customer/foods');
const router = new (require('koa-router'))()


router.get('/api/test/customer/deal/menu', foods.getUserMenus);
router.get('/api/test/customer/eshop/menu', foods.getEshopUserMenus);
router.post('/api/test/customer/rating', foods.saveUserRating);

module.exports = router