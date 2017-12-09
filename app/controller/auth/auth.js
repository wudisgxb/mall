const svgCaptcha = require('svg-captcha');

let db = require('../../db/mysql/index');
let Captcha = db.models.Captcha
let Admins = db.models.Adminer
let AdminCorresponding = db.models.AdminCorresponding
const getAuth = (function () {

    let getAdminLoginUsers = async function () {
        const captcha = svgCaptcha.create();

        //获取当前时间
        let date = new Date().format("yyyyMMddhhmmssS");
        //ary中喊随机数，和验证码图片
        //用当前时间和随机数拼接一个唯一的建
        let rumber = Math.random()*8999+1000
        let key = date+rumber;

        //将唯一的键和随机数存入数据库
        await Captcha.create({
            key: key,
            captcha: captcha.text
        });
        let aaa = {
            "key": key,
            // "buf": buf.toString('base64')
            "svg": captcha.data
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

