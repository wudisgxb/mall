let echarts = require('../../controller/admin/echarts');

const router = new (require('koa-router'))()

router.post('/api/v3/admin/echarts/sales', echarts.countSales);

router.post('/api/v3/admin/echarts/foods', echarts.countFoods);
module.exports = router