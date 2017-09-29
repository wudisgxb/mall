let Caap = require('ccap')();
let db = require('../../db/mysql/index');
let Captcha = db.models.Captcha
let Admins = db.models.Adminer
let AdminCorresponding = db.models.AdminCorresponding
const getAuth = (function () {

    let getAdminLoginUsers = async function () {
        let ary = Caap.get();
        //获取当前时间
        let date = new Date().format("yyyyMMddhhmmssS");
        //ary中喊随机数，和验证码图片
        let txt = ary[0];
        let buf = ary[1];
        //用当前时间和随机数拼接一个唯一的建
        let key = date + txt;
        //将唯一的键和随机数存入数据库
        await Captcha.create({
            key: key,
            captcha: txt
        });
        // console.log(key)
        // console.log(txt)
        let aaa = {
            "key": key,
            "number": txt,
            "buf": buf.toString('base64')
        }
        return aaa
    }
    let getadminCorresponding = async function (whereJson) {
        let adminCorresponding = await AdminCorresponding.findOne({
            where:whereJson
        })
        return adminCorresponding
    }
    let getadmin = async function (whereJson) {
        let admin = await Admins.findOne({
            where:whereJson
        })
        return admin
    } 
    let instance = {
        getAdminLoginUsers: getAdminLoginUsers,
        getadmin : getadmin,
        getadminCorresponding : getadminCorresponding
    }

    return instance;
})();
module.exports = getAuth;

