const axios = require('axios');

async function getHolidays(year) {
  try {
    const response = await axios.get(`https://holidays-jp.github.io/api/v1/${year}/date.json`);
    return response.data;
  } catch (error) {
    console.error('祝日データの取得に失敗:', error);
    return {}; // 失敗したら空のオブジェクト返す
  }
}

module.exports = { getHolidays };