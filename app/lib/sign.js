var crypto = require('crypto');

var sign = (params, key) => {
    return crypto.createHMac('sha1', key)
        .update(
            [
                params.method,
                params.data,
                params.date
            ].join(' ')
        )
        .digest()
        .toString('base64');
};

var verify = (params, key, signature) => {
    return sign(params, key) === signature;
};

var httpDataParse = (request) => {

    var params = {};
    params.method = request.method.toLowerCase();
    if (params.method === 'post') {
        params.data = [];
        var body = request.body;
        for(var key in body) {
            params.data.push({key: key, val: body[key]});
        }
        params.data = request.href + params.data.sort((a, b) => {
            return a.key > b.key;
        }).map((val) => {
            return val.key + '&' + val.val;
        }).join('&');
    } else {
        params.data = requset.href;
    }

    params.date = request.headers.date;
    return params;
};

var httpSign = (request, key) => {

    return sign(httpDataParse(request), key);
};

var httpVerify = (request, key, signature) => {
    return verify(httpDataParse(request), key, signature);
};

var checkFormat = (headers) => {
    if (typeof headers.date === 'undefined') {
        return 'Date is required in HTTP header';
    }
    if (typeof headers.appId === 'undefined') {
        return 'AppId is required HTTP in header';
    }
    if (typeof headers.Signature === 'undefined') {
        return 'Signature is required in HTTP header';
    }
};

module.exports = {
    sign,
    verify,
    httpSign,
    httpVerify,
    checkFormat
};
