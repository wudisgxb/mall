
let db = require('../../db/mysql/index');
let Vip = db.models.Vips;

Vip.addColumn(
    'menus',
    'order',
    Sequelize.STRING
)

