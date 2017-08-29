
const getDayEchats = (function () {
    let getDay =  function (startTime,endTime) {
        //先得到起始时间的开始时间
        let startDay = new Date(startTime);
        let beginDate = startDay.getTime();
        //先得到起始时间的结束时间
        let endDate = new Date(endTime);
        let finish = endDate.getTime();
        let oneDay = 24*60*60*1000
        let result = [];
        for(let i = beginDate;i<finish;i+=oneDay){
            result.push({
                start:new Date(i),
                end:new Date((i+oneDay<=finish)?i+oneDay:finish)
            })
        }
        console.log(result)
        console.log(result.length)
        return result;
    }
    let instance = {
        getDay: getDay
    }
    return instance;
})();
module.exports = getDayEchats;