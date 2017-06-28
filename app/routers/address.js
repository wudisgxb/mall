const router = new (require('koa-router'))()
const Address = require('../controller/Address')

router.post('/api/v1/default/:id', Address.setDefault)
router.get('/api/v1/address', Address.getAll)
router.get('/api/v1/address/:id', Address.get)
router.post('/api/v1/address', Address.post)
router.put('/api/v1/address/:id', Address.put)
router.delete('/api/v1/address/:id', Address.delete)

module.exports = router