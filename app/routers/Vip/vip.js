let vip = require('../../controller/vip/vip');

const router = new (require('koa-router'))()

router.post('/api/test/admin/vip', vip.saveAdminVip);
router.put('/api/test/admin/vip', vip.updateAdminVipById);
router.get('/api/test/admin/vip',vip.getAdminVip);
router.get('/api/test/admin/vipByCount',vip.getAdminVipCount)
router.get('/api/test/admin/vipPhone',vip.getAdminVipPhone);
router.delete('/api/test/admin/vip',vip.deleteAdminVip);
router.get('/api/test/admin/updateVip',vip.updateVipmem);
module.exports = router
