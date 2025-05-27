var express = require('express');
var router = express.Router();
const calenderModel = require('../models/m_calender'); //モデルをインポート
const { getHolidays } = require('../lib/holiday'); // 祝日APIをインポート

function createcalenderData(year, month) {
  const weeks = [];
  const firstDate = new Date(year, month - 1, 1);
  const lastDate = new Date(year, month, 0).getDate();
  let week = new Array(firstDate.getDay()).fill(null);

  for (let date = 1; date <= lastDate; date++) {
    week.push({ date: date, total: null });
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }
  return weeks;
}

router.get('/', async (req, res) => {
  const year = parseInt(req.query.year) || 2025;
  const month = parseInt(req.query.month) || 1;

  try {
    const gamblingData = await calenderModel.getAll(); // getAllはPromiseを返すのでawaitで待つ

    const holidays = await getHolidays(year);
    const calenderData = createcalenderData(year, month);

    // 月データ取得して合計
    const monthData = await calenderModel.getByMonth(year, month); // getByMonthもPromiseなのでawait

    let monthTotal = 0;
    monthData.forEach(d => {
      monthTotal += Number(d.recovery) - Number(d.investment);
    });

    // 日別データ割り当て
    calenderData.forEach(week => {
      week.forEach(day => {
        if (day) {
          const dateString = `${year}-${String(month).padStart(2, '0')}-${String(day.date).padStart(2, '0')}`;
          const match = gamblingData.find(d => d.date_of_gambling === dateString);
          if (match) {
            day.total = Number(match.recovery) - Number(match.investment);
          }
        }
      });
    });
    //カレンダーに情報を渡す
    res.render('calender', {
      title: 'ギャンブル収支表',
      calenderData: calenderData,
      year: year,
      years:[2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030],
      month: month,
      months:[1,2,3,4,5,6,7,8,9,10,11,12],
      holidays: holidays,
      monthTotal: monthTotal, // 合計金額を渡す
      gamblingNames:['パチンコ','パチスロ','競馬','競輪','競艇','オートレース','宝くじ','スポーツくじ','その他']
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("DBエラー");
  }
});
//登録＆更新
router.post('/save', function (req, res) {
  const params = req.body;
  // 空のフィールドに対して0を設定する
  params.investment = params.investment ? params.investment : 0;  // 空の場合、0を代入
  params.recovery = params.recovery ? params.recovery : 0;   
  
  //収支を計算
  params.total = params.recovery - params.investment
  // データベースに保存
  calenderModel.create(params, function (err, newId) {
    if (err) {
      console.error("データ登録エラー:", err);
      res.status(500).send("DBラー:" + err.message);
    } else {
      // 登録成功、idを使ってリダイレクト
      console.log("登録成功、ID:", newId);
      res.redirect('/calender?year=' + 
        params.date_of_gambling.split('-')[0] + 
        '&month=' + params.date_of_gambling.split('-')[1]);
    }
  });
});
router.get('/getbydate', (req, res) => {
  const date = req.query.date;
  calenderModel.getByDate(date)
    .then(data => {
      res.json(data || []); // 配列で返す
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: 'DBエラー' });
    });
});
//削除
router.delete('/delete', (req, res) => {
  const id = req.query.id;
  if (!id) return res.status(400).json({ error: 'IDが必要です' });

  calenderModel.deleteById(id)
    .then(() => {
      res.json({ message: '削除成功' });
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: 'DBエラー' });
    });
});
//削除後のデータ取得
router.get('/gettotalbydate', (req, res) => {
  const date = req.query.date;
  calenderModel.getByDate(date)
    .then(records => {
      if (!records.length) {
        res.json({ total: null });
      } else {
        const total = records.reduce((sum, rec) => {
          return sum + (Number(rec.recovery) - Number(rec.investment));
        }, 0);
        res.json({ total });
      }
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: 'DBエラー' });
    });
});
router.get('/getbyyear', (req, res) => {
  const year = req.query.year;
  if (!year) return res.status(400).json({ error: '年が必要です' });

  calenderModel.getByYear(year)
    .then(data => {
      res.json(data || []);
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: 'DBエラー' });
    });
});
// 年別合計取得
router.get('/gettotalbyyear', (req, res) => {
  const year = req.query.year;
  if (!year) return res.status(400).json({ error: '年が必要です' });

  calenderModel.getByYear(year)
    .then(records => {
      if (!records.length) {
        res.json({ total: null });
      } else {
        const total = records.reduce((sum, rec) => {
          return sum + (Number(rec.recovery) - Number(rec.investment));
        }, 0);
        res.json({ total });
      }
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: 'DBエラー' });
    });
});
// 年の詳細データ取得
router.get('/getdetailsbyyear', (req, res) => {
  const year = req.query.year;
  if (!year) return res.status(400).json({ error: '年が必要です' });

  calenderModel.getByYear(year)
    .then(records => {
      res.json({ records });
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: 'DBエラー' });
    });
});
router.get('/gettotalbymonth', (req, res) => {
  const year = req.query.year;
  if (!year) return res.status(400).json({ error: '年が必要です' });

  calenderModel.getTotalByMonth(year)
    .then(totals => {
      res.json({ totals });
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: 'DBエラー' });
    });
});
router.get('/getdetailsbyday', (req, res) => {
  const year = req.query.year;
  const month = req.query.month;
  if (!year || !month) return res.status(400).json({ error: '年と月が必要です' });

  calenderModel.getByDay(year, month)
    .then(records => {
      res.json({ records });
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ error: 'DBエラー' });
    });
});
router.get('/getGamblingNames',async (req, res) =>{
  try {
    const gamblingNames = ['パチンコ', 'パチスロ', '競馬', '競輪', '競艇', 'オートレース', '宝くじ', 'スポーツくじ', 'その他'];
    
    // 各ギャンブル名に対する収支データを集計
    const gamblingTotals = [];
    let total = 0;
    for (let name of gamblingNames) {
      const gamblingData = await calenderModel.getByGambling(name);
      //console.log(`ギャンブル名: ${name}, データ:`, gamblingData);
      let totalInvestment = 0;
      let totalRecovery = 0;
    
      gamblingData.forEach(data => {
        totalInvestment += Number(data.investment);
        totalRecovery += Number(data.recovery);
      });
    
      const totalDiff = totalRecovery - totalInvestment;
    
      gamblingTotals.push({
        name,
        totalInvestment,
        totalRecovery,
        totalDiff,
        records: gamblingData
      });
    }

    res.json({ gamblingTotals }); // ギャンブル名と収支を一緒に返す
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'データ取得エラー' });
  }
  
})
module.exports = router;
 