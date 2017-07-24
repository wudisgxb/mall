let coupon = require('../../controller/admin/coupon');

const router = new (require('koa-router'))()

router.post('/api/test/admin/coupon', coupon.saveAdminCoupon);

router.put('/api/test/admin/coupon', coupon.updateAdminCoupon);

router.get('/api/test/admin/coupon', coupon.getAdminCoupon);

router.delete('/api/test/admin/coupon', coupon.deleteAdminCoupon);

module.exports = router