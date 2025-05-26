let sCurrentModal = "null"
function changeMonth(direction) {
  // 年月の取得
  const meta = document.getElementById('calendar-meta');
  let year = parseInt(meta.getAttribute('data-year'));
  let month = parseInt(meta.getAttribute('data-month'));

  // 月の移動処理
  if (direction === 'next') {
    month++;
    if (month > 12) {
      month = 1;
      year++;
    }
  } else if (direction === 'prev') {
    month--;
    if (month < 1) {
      month = 12;
      year--;
    }
  }

  // URL遷移
  location.href = `/calender/?year=${year}&month=${month}`;
}
function showYearMonthSelector() {
  const selector = document.getElementById('year-month-selector');
  selector.style.display = 'flex';  // ダイアログを表示
}
function goToSelectedYearMonth() {
  const selectedYear = document.getElementById('year-selector').value;
  const selectedMonth = document.getElementById('month-selector').value;

  if (!selectedYear || !selectedMonth) {
    alert('年と月を選択してください');
    return;
  }

  // 選択した年と月に関連するページや内容を表示
  // ここでは、選択した年月をURLパラメータとして使い、リダイレクトする例
  location.href = `/calender/?year=${selectedYear}&month=${selectedMonth}`;  // 年月のURLに遷移
}
// モーダルを開く関数
function showYearSelector() {
  document.getElementById('year_selector').style.display = 'flex';
  sCurrentModal = "ySelect";
}

// モーダルを閉じる関数
function closeYearSelectorModal() {
  document.getElementById('year_selector').style.display = 'none';
}

// 年を選択した後の処理
function SelectedYearmodal(year,month) {
    location.href = `/calender/?year=${year}&month=${month}`;
}
// モーダルを開く関数
function showMonthSelector() {
  document.getElementById('month_selector').style.display = 'flex';
  sCurrentModal = "mSelect";
}

// モーダルを閉じる関数
function closeMonthSelectorModal() {
  document.getElementById('month_selector').style.display = 'none';
}

// 年を選択した後の処理
function SelectedMonthmodal(yaer,month) {
    location.href = `/calender/?year=${yaer}&month=${month}`;
}

window.addEventListener('click', function(event) {
 const yearselectModal  = document.getElementById('year_selector');
 const monthselectModal = document.getElementById('month_selector');
 if (sCurrentModal === 'ySelect' && event.target === yearselectModal) {
   sCurrentModal = "null";
   closeYearSelectorModal();
 } else if (sCurrentModal === 'mSelect' && event.target === monthselectModal){
   sCurrentModal = "null";
   closeMonthSelectorModal();
 }
})