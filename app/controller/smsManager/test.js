var zy = require('./smsSend.js');


zy.sendSms(
    13585130223,

    6623,


    function (err, data, mess) {

        if (err) {

            console.log(err);

        } else {

            //console.log(data);

            //console.log(mess);

            console.log(data.body.status);
            console.log(data.body.desc);

        }
    }
);