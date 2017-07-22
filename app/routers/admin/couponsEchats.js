const db = require('../../db/mysql/index');
const sequelize = require('sequelize');
const util = require('util');
const moment = require('moment');
let couponsEchats = require('../../controller/admin/couponsEchats')

const router = new (require('koa-router'))()

router.post('/api/v3/admin/couponsEchats',couponsEchats.couponsEchats)

module.exports = router
