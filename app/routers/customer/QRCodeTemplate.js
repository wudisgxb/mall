const QRCodeTemplate = require('../../controller/customer/QRCodeTemplate');

const router = new (require('koa-router'))()


//查看二维码模板模板
router.get('/api/test/customer/QRCodeTemplate', QRCodeTemplate.getQRCodeTemplate);
router.get('/api/test/customer/QRCodeTemplateByIpay', QRCodeTemplate.getQRCodeTemplateIpay);


module.exports = router