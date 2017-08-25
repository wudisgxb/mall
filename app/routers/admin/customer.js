const db = require('../../db/mysql/index');
const sequelize = require('sequelize');

let customer = require('../../controller/admin/customer')

const router = new (require('koa-router'))()

router.post('/api/test/admin/customerByTenantId',customer.getCustomerBytenantId)
router.post('/api/test/admin/customerByPhone',customer.getCustomerByPhone)
router.put('/api/test/admin/customer',customer.updateCustomerBytenantId)
router.post('/api/test/admin/customer',customer.saveCustomerBytenantId)
router.delete('/api/test/admin/customerById',customer.deleteCustomerBytenantId)

module.exports = router