
var db = require('../../db/mysql/index');
var print = require('../../controller/admin/print')

const router = new (require('koa-router'))()

router.post('/v3/admin/printerSetting',  print.saveAdminPrint);
router.put('/api/v3/admin/print/:id', print.updateAdminPrintById);
router.get('/api/v3/admin/print',print.getAdminPrint);
router.delete('/api/v3/admin/print',print.deleteAdminPrint);
module.exports = router