const db = require('../../db/mysql/index');
const sequelize = require('sequelize');
const util = require('util');
const moment = require('moment');
let foodsEchats = require('../../controller/admin/foodsEchats')


const router = new (require('koa-router'))()
//报表
router.post('/api/v3/admin/foodsEchats',foodsEchats.savefoodEchats);

module.exports = router


