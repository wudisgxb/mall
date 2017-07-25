/**
 * Created by bian on 12/3/15.
 */
let transferAccounts = require('../../controller/admin/transferAccounts')


const router = new (require('koa-router'))()

router.post('/api/test/admin/transferAccountInfo/save',  transferAccounts.saveAdminTransferAccounts);
router.put('/api/test/admin/transferAccountInfo/save/:id',  transferAccounts.UpdateAdminTransferAccountsById);
router.get('/api/test/admin/transferAccountInfo',transferAccounts.getAdminTransferAccounts);
router.delete('/api/test/admin/transferAccountInfo/delete/:id',transferAccounts.deleteAdminTransferAccounts);
module.exports = router