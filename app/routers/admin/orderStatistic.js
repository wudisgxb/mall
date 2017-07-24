
var db = require('../../db/mysql/index');
var Admins = db.models.Adminer;
const orderStatistic = require('../../controller/admin/orderStatistic');
const router = new (require('koa-router'))()
// todo: redirect
router.post('/api/test/admin/orderStatistic', orderStatistic.getOrderStatistic);

module.exports = router