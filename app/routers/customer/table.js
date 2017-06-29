/**
 * Created by bian on 12/3/15.
 */

let table = require('../../controller/customer/table');

const router = new (require('koa-router'))()
    //查看桌状态的
    router.get('/api/v3/user/table/:id',table.getUserTableById);

module.exports = router