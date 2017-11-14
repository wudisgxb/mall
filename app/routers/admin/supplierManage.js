const supplierManage = require('../../controller/admin/supplierManage');
const router = new (require('koa-router'))()

router.post("/api/test/customer/supplierManage",supplierManage.saveSupplierManage);
router.put("/api/test/customer/supplierManage",supplierManage.updateSupplierManage);
router.get("/api/test/customer/supplierManageByTenantId",supplierManage.getSupplierManageByTenantId);
router.get("/api/test/customer/supplierManageBySupplierNumber",supplierManage.getSupplierManageById);
router.delete("/api/test/customer/supplierManage",supplierManage.deleteSupplierManage);
module.exports = router