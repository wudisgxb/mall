/**
 * Created by bian on 12/3/15.
 */
let table = require('../../controller/admin/table');
const router = new (require('koa-router'))()

router.post('/api/v3/admin/table/save',  table.saveAdminTable);
router.put('/api/v3/admin/table/save/:id',  table.updateAdminTableById);
router.get('/api/v3/admin/table',table.getAdminTable);
router.delete('/api/v3/admin/table/delete/:id',table.deleteAdminTable);
module.exports = router