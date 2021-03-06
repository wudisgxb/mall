let coupon = require('../../controller/customer/coupon');
let couponAdmin = require('../../controller/admin/coupon');

const router = new (require('koa-router'))()

router.post('/api/test/customer/deal/coupon', coupon.bindCoupon);
router.post('/api/test/customer/eshop/coupon', coupon.bindCoupon);

router.get('/api/test/customer/eshop/coupon', coupon.isCouponReceivable);
router.get('/api/test/customer/deal/coupon', coupon.isCouponReceivable);

router.get('/api/test/customer/eshop/availableCoupon', coupon.getAvailableCoupon);
router.get('/api/test/customer/deal/availableCoupon', coupon.getAvailableCoupon);

//独立接口 优惠券绑定订单号
router.post('/api/test/customer/eshop/couponBindTradeNo', coupon.couponBindTradeNo);
router.post('/api/test/customer/deal/couponBindTradeNo', coupon.couponBindTradeNo);

router.delete('/api/test/customer/eshop/coupon', couponAdmin.deleteAdminCoupon);
router.delete('/api/test/customer/deal/coupon', couponAdmin.deleteAdminCoupon);

module.exports = router