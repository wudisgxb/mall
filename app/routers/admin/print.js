
var db = require('../../db/mysql/index');
var print = require('../../controller/admin/print')


module.exports = (router) => {

    

    router.post('/api/v3/admin/print',  print.saveAdminPrint);
    router.put('/api/v3/admin/print/:id', print.updateAdminPrintById);
    router.get('/api/v3/admin/print',print.getAdminPrint);
    router.delete('/api/v3/admin/print',print.deleteAdminPrint);
       
};