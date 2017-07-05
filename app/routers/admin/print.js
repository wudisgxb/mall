
var db = require('../../db/mysql/index');
var print = require('../../controller/admin/print')

const router = new (require('koa-router'))()

router.post('/v3/admin/printerSetting',  print.saveAdminPrint);
router.put('/api/v3/admin/printerSetting', print.updateAdminPrintById);
router.get('/api/v3/admin/printerSetting',print.getAdminPrint);
router.delete('/api/v3/admin/printerSetting',print.deleteAdminPrint);
module.exports = router