const db = require('../../db/mysql/index');
const TransferAccounts = db.models.TransferAccounts;

const transferAccounts = (function () {

    let pendingTransferAccounts = async function (trade_no, payee_account, amount, remark, paymentMethod, role, tenantId, consigneeId) {
        await TransferAccounts.create({
            trade_no: trade_no,
            status: 0,
            paymentMethod: paymentMethod,
            remark: remark,
            amount: amount,
            payee_account: payee_account,
            role: role,
            tenantId: tenantId,
            consigneeId: consigneeId
        })
    }

    let instance = {
        pendingTransferAccounts: pendingTransferAccounts,
    }

    return instance;
})();

module.exports = transferAccounts;