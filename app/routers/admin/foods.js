
const db = require('../../db/mysql/index');
const sequelize = require('sequelize');
const util = require('util');
const moment = require('moment');
let foods = require('../../controller/admin/foods');


const router = new (require('koa-router'))()

router.post('/api/v3/admin/foods/save',  foods.saveAdminFonds);
router.put('/api/v3/admin/foods/save/:id',foods.updateAdminFoodsById);
router.get('/api/v3/admin/foods',foods.getAdminFoods);
module.exports = router