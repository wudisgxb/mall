const distanceAndPrices= require('../../controller/customer/distanceAndPrices');

const router = new (require('koa-router'))()

//查看代售配送费
router.get('/api/test/customer/eshop/deliveryFee', distanceAndPrices.getDeliveryFee);

module.exports = router