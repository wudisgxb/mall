var db = require('../../db/mysql/index');
let mer = require('../../controller/customer/merchantRatings')

const router = new (require('koa-router'))()
router.post('/api/v3/user/merchantRatings', mer.saveUserMerchantRatings);

router.get('/api/v3/user/merchantRatings', mer.getusermerchantRatings);
module.exports = router