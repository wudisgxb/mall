const getAnYearEchats = (function () {
    let getAnYear = function (startTime, endTime) {
        //先得到起始时间的开始时间
        let startDay = parseInt(startTime);
        //先得到起始时间的结束时间
        let endDay = parseInt(endTime);
        let year = (endDay - startDay) * 12
        // let lastDate = endDate.getMonth();
        let result = [];

        for (let i = 0; i < year; i++) {
            //开始月份
            let Month = i + 1
            //结束月份
            let lastMonth = Month + 1
            //开始
            let startYear = startDay
            console.log(Month)
            if (Month % 12==0) {
                startYear += 1
                lastMonth = 1
            }

            result.push({
                start: new Date(startDay.toString() + "-" + Month.toString()),
                end: new Date(startYear.toString() + "-" + lastMonth.toString())
            })
        }
        // console.log(result.length)
        // console.log(result)
        return result;
    }
    let instance = {
        getAnYear: getAnYear
    }

    return instance;
})();
module.exports = getAnYearEchats;
