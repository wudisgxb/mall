const db = require('../../db/mysql/index');
const sequelize = require('sequelize');
const util = require('util');
const moment = require('moment');
let consumptionEchats = require('../../controller/admin/consumptionEchats')

const router = new (require('koa-router'))()

//暂时没用到
//router.post('/api/test/admin/consumptionEchats',consumptionEchats.consumptionEchats)

module.exports = router

