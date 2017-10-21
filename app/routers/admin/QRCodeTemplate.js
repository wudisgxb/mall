const QRCodeTemplate = require('../../controller/admin/QRCodeTemplate');

const router = new (require('koa-router'))()


//根据条件查看所有的二维码模板
router.get('/api/test/admin/QRCodeTemplate', QRCodeTemplate.getQRCodeTemplate);

router.get('/api/test/admin/QRCodeTemplateCount', QRCodeTemplate.getQRCodeTemplateCount);

router.get('/api/test/admin/getQRCodeTemplateByTenantId', QRCodeTemplate.getQRCodeTemplateByTenantId);

//新增二维码模板
router.post('/api/test/admin/QRCodeTemplate', QRCodeTemplate.saveQRCodeTemplate);

//编辑二维码模板
router.put('/api/test/admin/QRCodeTemplate', QRCodeTemplate.updateQRCodeTemplate);

//删除二维码模板
router.delete('/api/test/admin/QRCodeTemplate', QRCodeTemplate.deleteQRCodeTemplate);

//新增总二维码模板
router.post('/api/test/admin/QRCodeTemplateAll', QRCodeTemplate.saveAllQRCodeTemplate);

module.exports = router