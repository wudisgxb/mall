
const conversionIntegral = require('../../controller/vip/conversionIntegral');
const router = new (require('koa-router'))()
// todo: redirect
router.post('/api/test/admin/conversionIntegral', conversionIntegral.saveConversionIntegral);
router.post('/api/test/admin/conversionIntegralGood', conversionIntegral.saveConversionIntegralGood);

module.exports = router





