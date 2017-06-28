/**
 * Created by bian on 12/3/15.
 */
let transferAccounts = require('../../controller/admin/transferAccounts')



module.exports = (router) => {
    router.post('/api/v3/admin/transferAccountInfo/save',  transferAccounts.saveAdminTransferAccounts);
    router.put('/api/v3/admin/transferAccountInfo/save/:id',  transferAccounts.UpdateAdminTransferAccountsById);
    router.get('/api/v3/admin/transferAccountInfo',transferAccounts.getAdminTransferAccounts);
    router.delete('/api/v3/admin/transferAccountInfo/delete/:id',transferAccounts.deleteAdminTransferAccounts);
};