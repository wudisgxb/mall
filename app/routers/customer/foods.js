
var db = require('../../db/mysql/index');
var sequelize = require('sequelize');

let foods = require('../../controller/customer/foods');
const router = new (require('koa-router'))()


router.get('/api/v3/customer/deal/menu',foods.getUserMenus);
router.post('/api/v3/user/rating',foods.saveUserReting);

module.exports = router