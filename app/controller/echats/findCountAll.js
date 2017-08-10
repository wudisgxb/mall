
const getFindCount = (function () {

    let getCount = async function (tenantId,startTime,endTime,type,findClass) {
        //tenantId为查找参数
        //startTime为查找时间
        //type为查找类型
        //findClass为查找的类
        let result = await findClass.findAndCountAll({
            where:{
                tenantId:tenantId,
                createdAt:{
                    $gt:new Date(startTime),
                    $lt:new Date(endTime)
                }
            },
            paranoid: false
        })
        return result
    }
    let instance = {
        getCount: getCount
    }
    return instance;
})();
module.exports = getFindCount;