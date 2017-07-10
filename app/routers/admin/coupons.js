let coupon = require('../../controller/admin/coupon');

const router = new (require('koa-router'))()

router.post('/api/v3/admin/coupon', coupon.saveAdminCoupon);

router.put('/api/v3/admin/coupon', coupon.updateAdminCoupon);

router.get('/api/v3/admin/coupon', coupon.getAdminCoupon);

router.delete('/api/v3/admin/coupon', coupon.deleteAdminCoupon);

module.exports = router