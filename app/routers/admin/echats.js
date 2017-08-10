let echarts = require('../../controller/admin/echarts');

const router = new (require('koa-router'))()
//报表
router.post('/api/test/admin/echats/foodsEchats',echarts.savefoodEchats);
//昨日报表
router.post('/api/test/admin/echats/yesterDayFoods',echarts.yesterDayFoods);

router.post('/api/test/admin/echats/orderStatisticByTime', echarts.getOrderStatisticByTime);

router.get('/api/test/admin/echats/ordersStatisticAll',echarts.getAllOrderStatistic);
module.exports = router