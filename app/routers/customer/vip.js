let vip = require('../../controller/customer/vip')

const router = new (require('koa-router'))()

    

    router.post('/api/v2/user/vip/check',vip.saveUserVip);



module.exports = router