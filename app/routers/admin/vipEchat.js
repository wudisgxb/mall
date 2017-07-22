let vipEchats = require('../../controller/admin/vipEchats');

const router = new (require('koa-router'))()

router.post('/api/v3/admin/vipEchats', vipEchats.saveAdminVip);
module.exports = router
