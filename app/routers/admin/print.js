
var db = require('../../db/mysql/index');
var print = require('../../controller/admin/print')

const router = new (require('koa-router'))()

router.post('/api/test/admin/printerSetting',  print.saveAdminPrint);
router.put('/api/test/admin/printerSetting', print.updateAdminPrintById);
router.get('/api/test/admin/printerSetting',print.getAdminPrint);
router.delete('/api/test/admin/printerSetting',print.deleteAdminPrint);
module.exports = router