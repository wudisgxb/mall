
var zy = require('./smsSend.js');



zy.sendSms(

    13585130223,

    6623,



    function(err,data,mess){

        if(err){

            console.log(err);

        }else{

            //console.log(data);

            //console.log(mess);

            console.log(JSON.parse(data.body).reason);
            console.log(JSON.parse(mess).reason);

        }
    }

);