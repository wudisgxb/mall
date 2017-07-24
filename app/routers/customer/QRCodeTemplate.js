const QRCodeTemplate = require('../../controller/customer/QRCodeTemplate');

const router = new (require('koa-router'))()


//查看二维码模板模板
router.get('/api/test/customer/QRCodeTemplate', QRCodeTemplate.getQRCodeTemplate);

module.exports = router