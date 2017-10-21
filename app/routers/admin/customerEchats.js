const db = require('../../db/mysql/index');
const sequelize = require('sequelize');

let customerEchats = require('../../controller/admin/customerEchats')

const router = new (require('koa-router'))()
router.get('/api/test/admin/customerEchats',customerEchats.getCustomerBehavior)
module.exports = router