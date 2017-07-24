const getWeek_EveryYeays = (function () {

    let getWeeks = async function (currentDates) {
        let result=[];
        let currentDate = new Date(currentDates)
        let currentDay = currentDate.getDay()
        let currentYear = currentDate.getFullYear()
        let oneDay = 24*60*60*1000;
        //获取今年的初试时间
        currentYear.setFullYear(currentYear,0,1);
        let currentYears = currentYear.format("yyyy-MM-dd 00:00:00")
        //获取当前的毫秒数
        let currentDateTime = currentDate.getTime();
        //获取初始时间的毫秒数
        let currentYearTime = new Date(currentYears).getTime();
        //当前的毫秒数-初试时间的毫秒/一天的毫秒数 算出今年到当前时间的天数
        let currentWeekTime =(currentDateTime-currentYearTime)/oneDay
        let currentWeekDay = currentWeekTime-currentDay
        let currentWeekEndDay = currentWeekDay+7
        //当前周的前一周/7如果是7的倍数的话表示当前周，反之向上取余。+1表示当前周
        let currentWeek = currentWeekDay%7==0?currentWeekDay/7+1:Math.ceil(currentWeekDay/7)+1

        result.push({
            currentWeekDay : currentDay,
            currentWeek : currentWeek,
            currentEndWeek: currentWeekEndDay,
            currentTime : "这是第"+currentWeek+"周，第"+currentDay+"天"
        })
        return result;
    }
    let instance = {
        getWeeks: getWeeks
    }
    return instance;
})();
module.exportss = getWeek_EveryYeays;
