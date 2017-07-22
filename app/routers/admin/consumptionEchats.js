const db = require('../../db/mysql/index');
const sequelize = require('sequelize');
const util = require('util');
const moment = require('moment');
let consumptionEchats = require('../../controller/admin/consumptionEchats')

const router = new (require('koa-router'))()

router.post('/api/v3/admin/consumptionEchats',consumptionEchats.consumptionEchats)

module.exports = router

