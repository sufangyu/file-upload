module.exports = {
  /**
   * 生成从 minNum 到 maxNum 的随机数
   * 
   * @param {any} minNum 
   * @param {any} maxNum 
   * @returns 
   */
  randomNum: function(minNum,maxNum) {
    switch (arguments.length) { 
      case 1: 
        return parseInt(Math.random()*minNum+1,10); 
      break; 
      case 2: 
        return parseInt(Math.random()*(maxNum-minNum+1)+minNum,10); 
      break; 
        default: 
          return 0; 
        break; 
    } 
  },
}