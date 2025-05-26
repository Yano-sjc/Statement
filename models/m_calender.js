const sqlite3 = require('sqlite3');
const { get } = require('../routes');
const db = new sqlite3.Database('./Statement.db');
const table = 'gambling'; //テーブル名を指定

//ジャンルクラスを作成しておく
class Calender {
  constructor(data) {
    //dataのidは新規作成された場合はnullになる
    this.id = data.id ? data.id : null;
    //名前
    this.gambling_name = data.gambling_name;
    //投資金額
    this.investment = data.investment;
    //回収金額
    this.recovery = data.recovery;
    //収支の合計
    this.total = data.total;
    //日付
    this.date_of_gambling = data.date_of_gambling;
    //メモ
    this.memo = data.memo;
  }
}

module.exports = {
   // 全件取得（Promiseベースに変更）
   getAll: () => {
    return new Promise((resolve, reject) => {
      db.all(`SELECT * FROM ${table}`, [], (err, rows) => {
        if (err) {
          reject(err);
        }
        resolve(rows);
      });
    });
  },

  getByMonth: (year, month) => {
    return new Promise((resolve, reject) => {
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = `${year}-${String(month).padStart(2, '0')}-31`;

      db.all(
        `SELECT * FROM ${table} WHERE date_of_gambling BETWEEN ? AND ?`,
        [startDate, endDate],
        (err, rows) => {
          if (err) {
            reject(err);
          }
          resolve(rows);
        }
      );
    });
  },
  create: (data, callback) => {
    db.run(`INSERT INTO ${table} (gambling_name, investment, recovery,total, date_of_gambling, memo) VALUES (?, ?, ?, ?, ?,?)`,
      [data.gambling_name, data.investment, data.recovery ,data.total, data.date_of_gambling, data.memo],
      function (err) {
        if (err) {
          console.error(err.message);
          callback(err);
        } else {
          // 成功した場合、新規作成されたidを返す
          callback(null, this.lastID); // ここで新しく作成されたidを返す
        }
      }
    );
  },
  getByDate: function(date) {
    return new Promise((resolve, reject) => {
      db.all("SELECT * FROM gambling WHERE date_of_gambling = ?", [date], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },
  deleteById:function(id) {
    return new Promise((resolve, reject) => {
      const sql = 'DELETE FROM gambling WHERE id = ?';
      db.run(sql, [id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  },
  //年別データ取得用関数
  getByYear: function(year) {
    return new Promise((resolve, reject) => {
      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;
  
      const sql = `SELECT * FROM ${table} WHERE date_of_gambling BETWEEN ? AND ?`;
      db.all(sql, [startDate, endDate], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  },
  // 月別データ取得用関数
  getTotalByMonth: function(year) {
    return new Promise((resolve, reject) => {
      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;

      const sql = `
        SELECT 
          strftime('%m', date_of_gambling) AS month, 
          SUM(recovery - investment) AS total
        FROM ${table}
        WHERE date_of_gambling BETWEEN ? AND ?
        GROUP BY month
        ORDER BY month
      `;

      db.all(sql, [startDate, endDate], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          // monthは"01", "02"の文字列になるので数値に変換して返す
          const result = rows.map(row => ({
            month: Number(row.month),
            total: row.total
          }));
          resolve(result);
        }
      });
    });
  },
  getByDay: function(year, month) {
    return new Promise((resolve, reject) => {
      const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
      const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;
  
      const sql = `SELECT * FROM ${table} WHERE date_of_gambling BETWEEN ? AND ?`;
      db.all(sql, [startDate, endDate], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  },
  //ジャンルごとの収支を収集
  getByGambling: function(name){
    return new Promise((resolve, reject) => {
      const sql = `SELECT * FROM ${table} WHERE gambling_name = ?`;
      db.all(sql, [name], (err, rows) => {
        if (err) {
          console.error('SQLエラー:', err);  // ここ追加
          reject(err);
        } else {
          console.log(`取得データ (${name}):`, rows);  // ここ追加
          resolve(rows);
        }
      });
    });
  },
};