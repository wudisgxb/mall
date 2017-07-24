let echarts = require('../../controller/admin/echarts');

const router = new (require('koa-router'))()

router.post('/api/test/admin/echarts/sales', echarts.countSales);

router.post('/api/test/admin/echarts/foods', echarts.countFoods);
module.exports = router