let coupon = require('../../controller/customer/coupon');

const router = new (require('koa-router'))()

router.post('/api/v3/customer/coupon', coupon.bindCoupon);

router.get('/api/v3/customer/coupon', coupon.isCouponReceivable);

router.get('/api/v3/customer/availableCoupon', coupon.getAvailableCoupon);

module.exports = router