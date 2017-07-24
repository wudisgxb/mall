
const db = require('../../db/mysql/index');
const sequelize = require('sequelize');
const util = require('util');
const moment = require('moment');
let foods = require('../../controller/admin/foods');


const router = new (require('koa-router'))()
//新增
router.post('/api/test/admin/food', foods.saveAdminFoods);
//编辑
router.put('/api/test/admin/food', foods.updateAdminFoodsById);
//查询
router.get('/api/test/admin/food', foods.getAdminFoods);
module.exports = router