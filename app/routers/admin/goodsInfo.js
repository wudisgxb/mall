

var goodsInfo = require('../../controller/admin/goodsInfo')

const router = new (require('koa-router'))()

router.post('/api/test/admin/goodsInfo',  goodsInfo.saveAdminGoodsInfo);
// router.post('/api/test/admin/goodsInfoByfoods',  goodsInfo.saveGoodsInfo);
router.put('/api/test/admin/goodsInfo', goodsInfo.updateAdminGoodsInfo);
router.get('/api/test/admin/goodsInfo',goodsInfo.getAdminGoodsInfo);
router.get('/api/test/admin/goodsInfoByGoodsNumber',goodsInfo.getAdminGoodsInfoByGoodsNumber);
router.delete('/api/test/admin/goodsInfo',goodsInfo.deleteAdminGoodsInfo);
router.get('/api/test/admin/goodsInfoByCount',goodsInfo.getAdminGoodsInfoCount);
module.exports = router