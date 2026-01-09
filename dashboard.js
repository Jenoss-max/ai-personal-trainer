// ============================
// LOAD DATA
// ============================
const profile = JSON.parse(localStorage.getItem("userProfile") || "{}");
const history = JSON.parse(localStorage.getItem("poseHistory") || "[]");

const dailyBox = document.getElementById("dailySummary");
const weeklyBox = document.getElementById("weeklySummary");
const tableBody = document.getElementById("weeklyTable");
const chartCanvas = document.getElementById("weeklyChart");

// ============================
// GOAL & PROGRESS (NEW)
// ============================
if(profile.startWeight && profile.weight && profile.target){

  const total = profile.startWeight - profile.target;
  const done  = profile.startWeight - profile.weight;
  const progress = Math.max(
    0,
    Math.min(100, (done / total) * 100)
  );

  document.getElementById("goalBox").innerHTML = `
    👤 ${profile.name || "ผู้ใช้"}<br>
    น้ำหนักเริ่มต้น: ${profile.startWeight} kg<br>
    ปัจจุบัน: ${profile.weight} kg<br>
    เป้าหมาย: ${profile.target} kg<br><br>
    🔥 ความคืบหน้า: <b>${progress.toFixed(1)}%</b>
  `;

  document.getElementById("progressBar").style.width =
    progress.toFixed(1) + "%";
}

// ============================
// UTILS
// ============================
function grade(score){
  if(score >= 90) return "A";
  if(score >= 80) return "B";
  if(score >= 70) return "C";
  return "D";
}

// ============================
// DAILY SUMMARY
// ============================
const today = new Date().toISOString().slice(0,10);
const todayLogs = history.filter(h => h.date === today);

if(todayLogs.length === 0){
  dailyBox.innerText = "วันนี้ยังไม่มีการฝึก";
}else{
  const avg =
    todayLogs.reduce((a,b)=>a+Number(b.avgScore),0) / todayLogs.length;

  dailyBox.innerText =
    `ฝึก ${todayLogs.length} ครั้ง | Avg ${avg.toFixed(1)}% | Grade ${grade(avg)}`;
}

// ============================
// WEEKLY SUMMARY
// ============================
const weekAgo = Date.now() - 7*24*60*60*1000;
const lastWeek = history.filter(
  h => new Date(h.date).getTime() >= weekAgo
);

if(lastWeek.length === 0){
  weeklyBox.innerText = "ยังไม่มีข้อมูลใน 7 วันล่าสุด";
}else{
  const avg =
    lastWeek.reduce((a,b)=>a+Number(b.avgScore),0) / lastWeek.length;

  weeklyBox.innerText =
    `ฝึก ${lastWeek.length} ครั้ง | Avg ${avg.toFixed(1)}% | Grade ${grade(avg)}`;
}

// ============================
// TABLE + GROUP BY DATE
// ============================
const byDate = {};
lastWeek.forEach(h=>{
  if(!byDate[h.date]) byDate[h.date] = [];
  byDate[h.date].push(Number(h.avgScore));
});

const labels = [];
const values = [];

Object.keys(byDate).sort().forEach(date=>{
  const avg =
    byDate[date].reduce((a,b)=>a+b,0) / byDate[date].length;

  labels.push(date);
  values.push(avg.toFixed(1));

  tableBody.innerHTML += `
    <tr>
      <td>${date}</td>
      <td>${avg.toFixed(1)}%</td>
      <td>${grade(avg)}</td>
    </tr>
  `;
});

// ============================
// CHART
// ============================
if(labels.length > 0){
  new Chart(chartCanvas, {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        label: "Accuracy (%)",
        data: values,
        borderColor: "#00fff7",
        backgroundColor: "rgba(0,255,247,0.15)",
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { min: 0, max: 100 }
      }
    }
  });
}
