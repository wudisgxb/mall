let vip = require('../../controller/vip/vip');

const router = new (require('koa-router'))()

router.post('/api/test/admin/vip', vip.saveAdminVip);
router.put('/api/test/admin/vip', vip.updateAdminVipById);
router.get('/api/test/admin/vip',vip.getAdminVip);
// router.get('/api/test/admin/alliancesVip',vip.getAlliancesVip);
router.get('/api/test/admin/vipByCount',vip.getAdminVipCount.bind(vip))
router.get('/api/test/admin/vipPhone',vip.getAdminVipPhone);
router.delete('/api/test/admin/vip',vip.deleteAdminVip);
router.get('/api/test/admin/updateVip',vip.updateVipmem);
router.post('/api/test/admin/updateVipfoods',vip.fonds.bind(vip));
module.exports = router
