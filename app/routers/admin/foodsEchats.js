
let foodsEchats = require('../../controller/admin/foodsEchats')


const router = new (require('koa-router'))()
//报表
router.post('/api/test/admin/foodsEchats',foodsEchats.savefoodEchats);
//昨日报表
router.post('/api/test/admin/foodsNewDay',foodsEchats.savefoodsEchats);
module.exports = router


