
const db = require('../../db/mysql/index');
const sequelize = require('sequelize');
const util = require('util');
const moment = require('moment');
let foods = require('../../controller/admin/foods');


const router = new (require('koa-router'))()
router.post('/api/v3/admin/food',  foods.saveAdminFoods);
router.put('/api/v3/admin/food',foods.updateAdminFoodsById);
router.get('/api/v3/admin/food',foods.getAdminFoods);
module.exports = router