const db = require('../../db/mysql/index');
const sequelize = require('sequelize');

let customer = require('../../controller/admin/customer')

const router = new (require('koa-router'))()
router.get('/api/test/admin/customerByCount',customer.getCustomerByCount)
router.get('/api/test/admin/customerByPhone',customer.getCustomersPhoneBytenantId)
router.get('/api/test/admin/customerByAll',customer.getCustomerByAll)
router.put('/api/test/admin/customerAll',customer.updateCustomerAll)
router.get('/api/test/admin/customerByTenantId',customer.getCustomerBytenantId)
router.post('/api/test/admin/customerByPhone',customer.getCustomerByPhone)
router.put('/api/test/admin/customer',customer.updateCustomerBytenantId)
router.post('/api/test/admin/customer',customer.saveCustomerBytenantId)
router.delete('/api/test/admin/customerById',customer.deleteCustomerBytenantId)

module.exports = router