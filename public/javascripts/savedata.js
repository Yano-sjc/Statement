let currentModal = 'none';
let selectedYear = null;
function openModal(date) {
   // モーダルを表示
  const modal = document.getElementById('modal');
  modal.style.display = 'flex';
  
  // 日付をセット
  const dateParts = date.split('-');  // ["2025", "04", "17"]
  const month = Number(dateParts[1]);
  const day = Number(dateParts[2]);
  document.getElementById('modal-date').innerText = `${month}月${day}日`;
  document.querySelector('input[name="date_of_gambling"]').value = date;

  // 表示エリアを初期化
  const recordInfo = document.getElementById('record-info');
  recordInfo.innerHTML = '<p>ロード中...</p>';

  // データ取得
  fetch(`/calender/getbydate?date=${date}`)
    .then(response => {
      if (!response.ok) throw new Error('ネットワークエラー');
      return response.json();
    })
    .then(records => {
      if (!records.length) {
        recordInfo.innerHTML = '<p>登録データはありません。</p>';
        return;
      }
      let totalInvestment = 0;
      let totalRecovery = 0;
      let alltotal = 0;
      let recordsHtml = '';

      records.forEach(record => {
        totalInvestment += Number(record.investment);
        totalRecovery += Number(record.recovery);
        alltotal += Number(record.recovery) - Number(record.investment);
        // レコードのHTMLを生成
        recordsHtml += `
          <div class="record-item" style="margin-bottom: 8px;">
            <strong>${record.gambling_name}</strong><br>
            投資：${record.investment} 円 / 回収：${record.recovery} 円<br>
            収支：${record.recovery - record.investment}円<br>
            メモ：${record.memo}
            <div style ="text-align: right;">
              <button onclick="deleteRecord(${record.id}, '${record.date_of_gambling}')">削除</button>
            <hr>
          </div>
        `;
      });

      // 合計＋レコード表示
      recordInfo.innerHTML = `
        ${recordsHtml}
        <p><strong>投資合計：</strong>${totalInvestment} 円</p>
        <p><strong>回収合計：</strong>${totalRecovery} 円</p>
        <p><strong>収支合計：</strong>${alltotal} 円</p>
        <hr>
      `;
    })
    .catch(error => {
      console.error('データ取得失敗', error);
      recordInfo.innerHTML = '<p>データ取得失敗しました。</p>';
    });
    // モーダルの外側クリックで閉じる
    window.addEventListener('click', function(event) {
    const modal = document.getElementById('modal');
    if (event.target === modal) {
      closeModal();
    }
    });
} 
//合計の更新
function updateDayTotal(date) {
  console.log('アップデート中');
  fetch(`/calender/gettotalbydate?date=${date}`)
    .then(response => {
      if (!response.ok) throw new Error('取得失敗');
      return response.json();
    })
    .then(result => {
      const cell = document.querySelector(`td[data-date='${date}']`);
      if (cell) {
        const totalDisplay = cell.querySelector('.total-display');
        if (totalDisplay) {
          totalDisplay.innerText = result.total !== null ? `${result.total} 円` : '';
          totalDisplay.classList.remove('positive', 'negative');
          if (result.total > 0) {
            totalDisplay.classList.add('positive');
          } else if (result.total < 0) {
            totalDisplay.classList.add('negative');
          }
        
        }
        
      }
    })
    .catch(err => {
      console.error('合計収支取得失敗', err);
    });
}
// 合計を更新する関数
function updateAllDayTotals() {
  document.querySelectorAll('td[data-date]').forEach(td => {
    const date = td.getAttribute('data-date');
    updateDayTotal(date);
  });
}
// 削除ボタンが押されたときの処理
function deleteRecord(id, date) {

  fetch(`/calender/delete?id=${id}`, {
    method: 'DELETE',
  })
  .then(response => {
    if (!response.ok) throw new Error('削除失敗');

    // 削除後に残りのデータを取得してモーダルの表示を更新する
    fetch(`/calender/getbydate?date=${date}`)
      .then(res => res.json())
      .then(records => {
        let totalInvestment = 0;
        let totalRecovery = 0;
        let recordsHtml = '';

        if (records.length === 0) {
          document.getElementById('record-info').innerHTML = '<p>登録データはありません。</p>';
        } else {
          records.forEach(record => {
            totalInvestment += Number(record.investment);
            totalRecovery += Number(record.recovery);
            recordsHtml += `
              <div class="record-item" style="margin-bottom: 8px;">
                <strong>${record.gambling_name}</strong><br>
                投資：${record.investment} 円 / 回収：${record.recovery} 円<br>
                メモ：${record.memo}
                <button onclick="deleteRecord(${record.id}, '${record.date_of_gambling}')">削除</button>
                <hr>
              </div>
            `;
          });

          document.getElementById('record-info').innerHTML = `
            ${recordsHtml}
            <p><strong>投資合計：</strong>${totalInvestment} 円</p>
            <p><strong>回収合計：</strong>${totalRecovery} 円</p>
            <hr>
          `;
        }
        
        // カレンダーの合計金額を更新
        updateDayTotal(date);
        // ページを丸ごと再読み込み
        location.reload();
      });
  })
  .catch(err => {
    console.error('削除エラー', err);
    alert('削除に失敗しました');
  });
}
//年別データをモーダルで表示
function openYearModal(){
  //現在開かれているモーダルを閉じる
  closeMonth();
  closeDay();
  //モーダル表示
  const modal = document.getElementById('year-modal');
  modal.style.display ='flex';
  //グローバル変数に入れる
  currentModal = 'year';

  const yearDataInfo = document.getElementById('year-data-info');
  yearDataInfo.innerHTML = '<p>ロード中...</p>';
  const years = [2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030];
  let resultHtml = '';
  Promise.all(years.map(year => {
    return fetch(`/calender/gettotalbyyear?year=${year}`)
      .then(response => {
        if (!response.ok) throw new Error('取得失敗');
        return response.json().then(data => ({ year, total: data.total }));
      });
  }))
  .then(results => {
    let grandTotal = 0;
    results.forEach(item => {
      const total = item.total !== null ? item.total : 0;
      grandTotal += total;
      resultHtml += `<h4><a href="#"class="year-link" onclick="openMonthModal(${item.year})">${item.year}年：${item.total !== null ? item.total + ' 円' : '0円'}</a></h4>`;
    });
    resultHtml += `<hr><h3><strong>全期間合計：${grandTotal} 円</strong></h3>`;
    resultHtml += `<button onclick="closeYearModal()">戻る</button>`;
    yearDataInfo.innerHTML = resultHtml;
  })
  .catch(err => {
    console.error('年データ取得失敗', err);
    yearDataInfo.innerHTML = '<p>取得失敗しました。</p>';
  });
}
//月別のモーダルで表示
function openMonthModal(years) {
  // まず年別モーダルを閉じる
  closeYearModal();
  closeDay();
  openMonth();
  const detailArea = document.getElementById('month-data-info');
  detailArea.innerHTML = '<p>読み込み中...</p>';
  fetch(`/calender/gettotalbymonth?year=${years}`)
    .then(response => {
      if (!response.ok) throw new Error('取得失敗');
      return response.json();
    })
    .then(data => {
      let html = `<h3>${years}年の月別収支一覧</h3>`;
      const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
      let grandTotal = 0;

      months.forEach(month => {
        // APIの結果から該当する月のデータを探す
        const found = data.totals.find(item => item.month === month);
        const total = found ? found.total : 0;
        grandTotal += total;
        console.log(years,month);
        html += `<h4></h4>`;
        html += `<h4><a href="#"class="year-link" onclick="showDayDetails(${years}, ${month})">${month}月：${total} 円</a></h4>`;
      });

      html += `<hr><h3><strong>${years}年合計：${grandTotal} 円</strong></h3>`;
      html += `<button onclick="openYearModal()">戻る</button>`;

      detailArea.innerHTML = html;
    })
    .catch(err => {
      console.error('月別データ取得失敗', err);
      detailArea.innerHTML = '<p>取得失敗しました。</p>';
    });
    
    
}

function showDayDetails(year, month) {
  //月別モーダルを閉じる
  closeMonth();
  //モーダルの表示
  openDay();
  const detailArea = document.getElementById('day-data-info');
  detailArea.innerHTML = '<p>読み込み中...</p>';

  fetch(`/calender/getdetailsbyday?year=${year}&month=${month}`)
    .then(response => {
      if (!response.ok) throw new Error('取得失敗');
      return response.json();
    })
    .then(data => {
      if (!data.records.length) {
        detailArea.innerHTML = `<p>${year}年${month}月のデータはありません。</p>`;
        detailArea.innerHTML +=`<button onclick="openMonthModal(${year})">戻る</button>`;
      } else {
        let html = `<h3></h3>`;
        let count= 0;
        let win = 0;
        let defeat = 0;
        let winning= 0;
        const dailyRecords = {};
        //勝敗カウント
         data.records.forEach((rec,) =>{
           const diff = Number(rec.recovery) - Number(rec.investment);
           if(diff > 0)
             win++;
           else{
             defeat++;
           }
         })
         //勝敗を表示
         count = win + defeat;
         winning = (win / count)* 100;
         html += `<h3>回数：${count}<br>
              勝ち：${win}負け：${defeat}<br>
              勝率：${Math.floor(winning)}%</h3>`;
        data.records.forEach(rec => {
          const dateParts = rec.date_of_gambling.split('-');
          const day = Number(dateParts[2]);
    
          if (!dailyRecords[day]) {
            dailyRecords[day] = [];
          }
          dailyRecords[day].push(rec);
        });
    
        Object.keys(dailyRecords).sort((a, b) => a - b).forEach(day => {
          let dayTotal = 0;
          html += `<h3>${month}月${day}日</h3>`;
          
          dailyRecords[day].forEach(rec => {
            const diff = Number(rec.recovery) - Number(rec.investment);
            html += `
              <p><strong>${rec.gambling_name}</strong></p>
              <p>投資 ${rec.investment}円 ： 回収 ${rec.recovery}円</p>
              <p>収支 ${diff}円</p>
            `;
            dayTotal += diff;
          });
    
          html += `<p><strong>【合計収支】 ${dayTotal} 円</strong></p>`;
          html += `<hr>`;
        });
    
        html += `<button onclick="openMonthModal(${year})">戻る</button>`;
        detailArea.innerHTML = html;
      }
    })
    .catch(err => {
      console.error('取得失敗', err);
      detailArea.innerHTML = '<p>取得失敗しました。</p>';
    });
    
}
//ジャンル別のモーダル表示
function openGenreModel(){
  // モーダルを表示
  const modal = document.getElementById('genre-modal');
  modal.style.display = 'flex';

  
  //初期化
  const genreDataInfo = document.getElementById('genre-data-info');
  genreDataInfo.innerHTML = '<p>ロード中...</p>';

  fetch(`/calender/getGamblingNames`)
    .then(response => {
      if (!response.ok) throw new Error('取得失敗');
      return response.json();})
    .then(data => {
      if (!data.gamblingTotals.length) {
        genreDataInfo.innerHTML = `<p>年のデータはありません。</p>`;} 
      else {
        let html = ``;
        let currentDate = null;
        // ギャンブル名ごとに表示
        data.gamblingTotals.forEach(genre => {
          html += `<h2>${genre.name}</h2>`;
          let count= 0;
          let win = 0;
          let defeat = 0;
          let winning= 0;
          // 各レコードの詳細を表示
          genre.records.forEach(rec => {
            console.log(rec);
            const diff = Number(rec.recovery) - Number(rec.investment);
            currentDate = rec.date_of_gambling;
            const dateParts = currentDate.split('-');
            const month = Number(dateParts[1]);
            const day = Number(dateParts[2]);
            html += `<p><strong>${month}月${day}日</strong></p>`;
            html += `<p>回収 ${rec.recovery} 円 ： 投資 ${rec.investment} 円</p>`;
            html += `<p>収支 ${diff} 円</p><br>`;
            if(diff > 0)
              win++;
            else{
              defeat++;
            }
          });
          //勝敗を表示
          count = win + defeat;
          winning = (win / count)* 100;
          if(count === 0)
            winning = 0;
          html += `<h3>回数：${count}<br>
              勝ち：${win}負け：${defeat}<br>
              勝率：${Math.floor(winning)}%</h3>`;
          // 合計収支表示
          html += `<strong>【${genre.name} 合計収支】 ${genre.totalDiff} 円</strong><hr>`;
        });
        
        
        // 表示エリアに反映
        genreDataInfo.innerHTML = html;
      }
    })
    .catch(err => {
      console.error('詳細データ取得失敗', err);
      genreDataInfo.innerHTML = '<p>取得失敗しました。</p>';
    });
  // モーダルの外側クリックで閉じる
  window.addEventListener('click', function(event) {
    const modal = document.getElementById('genre-modal');
    if (event.target === modal) {
      closeGenreModal()
    }
  });
}
//月別モーダルの表示
function openMonth(){
  const modal = document.getElementById('month-modal');
  modal.style.display = 'flex';
  currentModal = 'month';
}
function closeMonth(){
  document.getElementById('month-modal').style.display = 'none';
}
//日別モーダルの表示
function openDay(){
  const modal = document.getElementById('day-modal');
  modal.style.display = 'flex';
  currentModal = 'day';
}
function closeDay(){
  document.getElementById('day-modal').style.display = 'none';
}
// 年別データのモーダルを閉じる関数
function closeYearModal() {
  document.getElementById('year-modal').style.display = 'none';
}
//ジャンル別のモーダルを閉じる関数
function closeGenreModal(){
  document.getElementById('genre-modal').style.display = 'none';
}
// 編集のモーダルを閉じる関数
function closeModal() {
  document.getElementById('modal').style.display = 'none';
}

function saveData() {
  const gamblingName = document.querySelector('select[name="gambling_name"]').value;
  const form = document.getElementById('edit-form');
  if (!form) {
    console.error('フォームが見つかりませんでした！');
    return;
  }
  if (!gamblingName) {
    alert('ギャンブル名を選択してください！');
    return false;
  }
  else{
    // フォームを送信
    document.getElementById('edit-form').submit();
    closeModal();
  }
  
  } 

function adjustValue(id, amount) {
  const input = document.getElementById(id);
  let newValue = parseInt(input.value) + amount;
  if (newValue < 0) newValue = 0;
  input.value = newValue;

  // 対応するrangeも更新
  const range = input.parentElement.querySelector('input[type="range"]');
  range.value = newValue;
}

function syncValue(id, value) {
  const input = document.getElementById(id);
  input.value = value;
}
function setupModalCloseEvents() {
  window.addEventListener('click', function(event) {
    const yearModal  = document.getElementById('year-modal');
    const monthModal = document.getElementById('month-modal');
    const dayModal = document.getElementById('day-modal');
    console.log("デバッグ用",currentModal === 'year');
    if (currentModal === 'day' && event.target === dayModal) {
      closeDay();
      openMonth(selectedYear);  // 選択された年を保持しておくとよい
      console.log("月別モーダルが開かれた");
      currentModal = 'month';
    } else if (currentModal === 'month' && event.target === monthModal) {
      closeMonth();
      openYearModal();
      console.log("年別モーダルが開かれた")
      currentModal = 'year';
    }
    else if (currentModal === 'year' && event.target === yearModal) {
      closeYearModal();
      console.log("年別モーダルを閉じた")
      currentModal = 'null';
    }
  });
}
document.addEventListener('DOMContentLoaded', setupModalCloseEvents);
// ページ読み込み時に実行
window.addEventListener('DOMContentLoaded', updateAllDayTotals);
document.addEventListener('DOMContentLoaded', () => {
  setupModalCloseEvents();
});

