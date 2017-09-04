let echarts = require('../../controller/admin/echarts');

const router = new (require('koa-router'))()
//报表
router.post('/api/test/admin/echats/foodsEchats',echarts.savefoodEchats);
//昨日报表
router.post('/api/test/admin/echats/yesterDayFoods',echarts.yesterDayFoods);
//查询菜品种类
router.get('/api/test/admin/ordersStatisticByGetStyle', echarts.getStyle);
//根据菜品种类查询客户的信息
router.get('/api/test/admin/ordersStatisticByStyle', echarts.getOrderstatisticByStyle);
//根据时间状态查询报表
router.post('/api/test/admin/echats/orderStatisticByTime', echarts.getOrderStatisticByTime);
//查询所有的统计报表
router.get('/api/test/admin/echats/ordersStatisticAll',echarts.getAllOrderStatistic);
module.exports = router