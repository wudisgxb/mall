

var goodsPromotionManager = require('../../controller/admin/goodsPromotions')

const router = new (require('koa-router'))()

router.post('/api/test/admin/goodsPromotion',  goodsPromotionManager.saveAdminGoodsPromotion);
router.put('/api/test/admin/goodsPromotion', goodsPromotionManager.updateAdminGoodsPromotion);
router.get('/api/test/admin/goodsPromotion',goodsPromotionManager.getAdminGoodsPromotion);
router.get('/api/test/admin/goodsPromotionCount',goodsPromotionManager.getAdminGoodsPromotionCount);
router.delete('/api/test/admin/goodsPromotion',goodsPromotionManager.deleteAdminGoodsPromotion);
module.exports = router