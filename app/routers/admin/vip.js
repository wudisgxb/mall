let vip = require('../../controller/admin/vip');

const router = new (require('koa-router'))()

router.post('/api/test/admin/vip', vip.saveAdminVip);
router.put('/api/test/admin/vip', vip.updateAdminVipById);
router.get('/api/test/admin/vip',vip.getAdminVip);
router.delete('/api/test/admin/vip',vip.deleteAdminVip);
module.exports = router