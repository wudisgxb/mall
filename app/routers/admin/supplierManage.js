const supplierManage = require('../../controller/admin/supplierManage');
const router = new (require('koa-router'))()

router.post("/api/test/admin/supplierManage",supplierManage.saveSupplierManage);
router.put("/api/test/admin/supplierManage",supplierManage.updateSupplierManage);
router.get("/api/test/admin/supplierManage",supplierManage.getSupplierManageByTenantId);
router.get("/api/test/admin/supplierManageBySupplierNumber",supplierManage.getSupplierManageById);
router.delete("/api/test/admin/supplierManage",supplierManage.deleteSupplierManage);
module.exports = router