/**
 * Created by bian on 12/3/15.
 */

var revenueManager = require('../../controller/admin/revenueManager')
const router = new (require('koa-router'))()

//查询收退款信息
router.get('/api/test/admin/receivablesInfo', revenueManager.getAdminReceivablesInfo);
module.exports = router
