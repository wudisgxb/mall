const QRCodeTemplate = require('../../controller/admin/QRCodeTemplate');

const router = new (require('koa-router'))()


//根据租户id查看所有的二维码模板
router.get('/api/test/admin/QRCodeTemplate', QRCodeTemplate.getQRCodeTemplate);

//新增二维码模板
router.post('/api/test/admin/QRCodeTemplate', QRCodeTemplate.saveQRCodeTemplate);

//编辑二维码模板
router.put('/api/test/admin/QRCodeTemplate', QRCodeTemplate.updateQRCodeTemplate);

//删除二维码模板
router.delete('/api/test/admin/QRCodeTemplate', QRCodeTemplate.deleteQRCodeTemplate);

module.exports = router