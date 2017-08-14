let distanceandprices = require('../../controller/admin/distanceandprices');

const router = new (require('koa-router'))()

// router.post('/api/test/admin/echarts/sales', echarts.countSales);

router.get('/api/test/admin/distanceandprice', distanceandprices.getDistanceFee);
// router.get('/api/test/admin/distanceandpriceBydistance', distanceandprices.getDistanceFeeDistance);
router.post('/api/test/admin/distanceandprice', distanceandprices.saveDistanceFee);
router.put('/api/test/admin/distanceandprice', distanceandprices.updateDistanceFee);
router.delete('/api/test/admin/distanceandprice', distanceandprices.deleteDistanceFee);
module.exports = router