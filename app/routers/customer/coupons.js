let coupon = require('../../controller/customer/coupon');

const router = new (require('koa-router'))()

router.post('/api/v3/customer/coupon', coupon.useCoupon);

router.get('/api/v3/customer/coupon', coupon.getAvailableCoupon);

module.exports = router