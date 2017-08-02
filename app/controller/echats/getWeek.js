const getWeek_EveryYeay = (function () {

    let getWeek = async function (currentDates) {
        let weekDate;
        //获取当年的年份
        let currentYear = new Date(currentDates).getFullYear()
        //获取当前月份
        let currentMonth = new Date(currentDates).getMonth()
        //获取当前天数（一个月的第几天）
        let currentDate = new Date(currentDates).getDate();
        //获取当前天数（一周的第几天）
        let currentDay = new Date(currentDates).getDay();
        //查出所有月份的天数
        let arrayDay=[];
        arrayDay[0]=31
        arrayDay[2]=31
        arrayDay[3]=30
        arrayDay[4]=31
        arrayDay[5]=30
        arrayDay[6]=31
        arrayDay[7]=31
        arrayDay[8]=30
        arrayDay[9]=31
        arrayDay[10]=30
        arrayDay[11]=31
        //判断是否为闰年
        if((currentYear%100==0&&currentYear%400==0)||(currentYear%100!=0&&currentYear%4==0)){
            arrayDay[1]=29
        }else{
            arrayDay[1]=28
        }
        let i;
        //当前月份的前一个月是今年的第几天
        let monthDay=0;
        //当前天数是今年的第几天
        let yearDay=0
        //判断arrayDay数组中是否包含currentMonth
        if(arrayDay[currentMonth]){
            //获取当前天数
            for(i=0;i<arrayDay.length-1;i++){
                monthDay+=arrayDay[i]
            }
        }
        //这个月前的天数加上这个月的天数
        yearDay = monthDay+currentDate;
        let week = Math.cell((yearDay-currentDay)/7)
        let currentWeek = week+1;
        return currentWeek;
    }
    let instance = {
        getWeek: getWeek
    }
    return instance;
})();
module.exports = getWeek_EveryYeay;