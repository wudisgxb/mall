
let foods = require('../../controller/admin/foods');


const router = new (require('koa-router'))()

router.put('/api/test/admin/foodBySellCount', foods.updateAdminFoodsBySellCount);
//新增
router.post('/api/test/admin/food', foods.saveAdminFoods);
//编辑
router.put('/api/test/admin/food', foods.updateAdminFoodsById);
//查询
router.get('/api/test/admin/food', foods.getAdminFoodsTenantId);
// router.put('/api/test/admin/foodAllImage', foods.updateFoodOne);


//查询个数
router.get('/api/test/admin/foodByCount', foods.getAdminFoodsByCount);
//删除
router.delete('/api/test/admin/food', foods.deleteFoods);

module.exports = router