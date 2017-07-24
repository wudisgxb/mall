var db = require('./index.js');
var co = require('co');

var util = require('util');
var tool = require('../../Tool/tool');



function * init() {
    yield db.sync({
        force: true
    });
    //yield userSeed();

}

function * update() {
    yield db.sync({
        force: false
    });
}

co(function *() {
    //yield init();
    yield update();

    console.log('finished ...');
    process.exit(0)
}).catch(function () {
    console.log(arguments);
});
