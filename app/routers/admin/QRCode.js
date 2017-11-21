const QRCode = require('../../controller/admin/QRCode');

const router = new (require('koa-router'))()


//获取导航并返回扫描次数
router.get('/api/test/admin/QRCodeUrl', QRCode.getQRCodeUrl);

module.exports = router