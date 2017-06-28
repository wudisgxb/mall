var crypto = require('crypto');

var Reg = {};

Reg.ip = (function() {
    var ipReg =  /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/;
    return (str) => {
        return ipReg.test(str);
    };
}());

var md5 = (str, encoding) => {
    encoding = encoding || 'base64';
    var md5 = crypto.createHash('md5');
    md5.update(str);
    return md5.digest(encoding);
};

var randomNum = (length) => {
    return Math.random().toString(10).substring(2, 2 + length);
};

var intToFixString = (str, length) => {
    str = str.toString();
    var len = length - str.length;
    for(i = 0; i < len; i ++) {
        str = '0' + str;
    }
    return str;
};

var find = (arr, fnOrVal, key) => {
    for(var i in arr) {
        if (typeof fnOrVal === 'function' && fnOrVal(arr[i], i, arr)){
            return {
                key: i,
                value: arr[i]
            }
        } else {
            var ele = typeof key === 'undefined' ? arr[i] : arr[i][key];
            if (ele == fnOrVal){
                return {
                    key: i,
                    value: arr[i]
                }
            }
        }
    }
};

module.exports = {
    Reg,
    md5,
    randomNum,
    intToFixString,
    find
};
