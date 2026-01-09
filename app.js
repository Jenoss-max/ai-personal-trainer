// ================= CONFIG =================
const SET_TIME = 20;
const REST_TIME = 10;
const COUNTDOWN_TIME = 3;

const master = {
  kneeMax: 140,
  kneeDown: 100,
  backMin: 150,
  hipMin: 60
};

// ================= EXERCISE MAP =================
const exerciseMuscle = {
  squat: ["legs", "glutes"]
};

// ================= DOM =================
const video = document.getElementById("camera");
const startBtn = document.getElementById("startBtn");
const feedback = document.getElementById("feedbackText");
const timerBox = document.getElementById("timer");
const repsBox = document.getElementById("reps");
const tbody = document.querySelector("#logTable tbody");
const finalScoreBox = document.getElementById("finalScore");
const finalGradeBox = document.getElementById("finalGrade");
const setSelect = document.getElementById("sets");
const recommendBox = document.getElementById("recommend");

// ================= STATE =================
let totalSets = 3;
let currentSet = 1;
let reps = 0;
let state = "up";
let scores = [];
let setResults = [];
let timer = 0;
let mode = "idle";
let interval;

// ================= UTILS =================
function angle(a,b,c){
  const ba={x:a.x-b.x,y:a.y-b.y};
  const bc={x:c.x-b.x,y:c.y-b.y};
  const dot=ba.x*bc.x+ba.y*bc.y;
  const mag=Math.hypot(ba.x,ba.y)*Math.hypot(bc.x,bc.y);
  return Math.acos(Math.min(Math.max(dot/mag,-1),1))*180/Math.PI;
}

function grade(s){
  if(s>=90) return "A";
  if(s>=80) return "B";
  if(s>=70) return "C";
  return "D";
}

// ================= MediaPipe =================
const pose = new Pose({
  locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${f}`
});

pose.setOptions({
  modelComplexity:1,
  smoothLandmarks:true,
  minDetectionConfidence:0.6,
  minTrackingConfidence:0.6
});

pose.onResults(onPose);

const camera = new Camera(video,{
  onFrame: async()=>{ await pose.send({image:video}); },
  width:640, height:360
});

// ================= POSE =================
function onPose(res){
  if(mode!=="training" || !res.poseLandmarks) return;

  const lm=res.poseLandmarks;
  const shoulder=lm[11];
  const hip=lm[23];
  const knee=lm[25];
  const ankle=lm[27];

  const kneeA=angle(hip,knee,ankle);
  const hipA=angle(shoulder,hip,knee);
  const fake={x:hip.x,y:hip.y-0.2};
  const backA=angle(shoulder,hip,fake);

  let score=100;
  let msg=[];

  if(kneeA>master.kneeMax){ msg.push("🦵 เข่ายังไม่พับ"); score-=20; }
  if(hipA<master.hipMin){ msg.push("🍑 สะโพกต่ำ"); score-=20; }
  if(backA<master.backMin){ msg.push("⚠️ หลังงอ"); score-=30; }

  feedback.innerText = msg.length ? msg.join(" | ") : "✅ ท่าดี";
  scores.push(Math.max(score,0));

  if(kneeA<master.kneeDown && state==="up") state="down";
  if(kneeA>160 && state==="down"){
    reps++;
    state="up";
    repsBox.innerText=`Reps: ${reps}`;
  }
}

// ================= FLOW =================
startBtn.onclick=()=>{
  totalSets = Number(setSelect.value);
  currentSet = 1;
  tbody.innerHTML="";
  setResults=[];
  finalScoreBox.innerText="–";
  finalGradeBox.innerText="–";
  startCountdown();
};

function startCountdown(){
  mode="countdown";
  timer=COUNTDOWN_TIME;
  feedback.innerText=`เริ่มใน ${timer}`;
  interval=setInterval(()=>{
    timer--;
    feedback.innerText=`เริ่มใน ${timer}`;
    if(timer<=0){
      clearInterval(interval);
      startSet();
    }
  },1000);
}

function startSet(){
  mode="training";
  reps=0;
  state="up";
  scores=[];
  timer=SET_TIME;
  repsBox.innerText="Reps: 0";
  feedback.innerText=`🔥 เซตที่ ${currentSet}`;
  camera.start();

  interval=setInterval(()=>{
    timer--;
    timerBox.innerText=timer;
    if(timer<=0){
      clearInterval(interval);
      finishSet();
    }
  },1000);
}

function finishSet(){
  camera.stop();
  mode="idle";

  const avg=scores.reduce((a,b)=>a+b,0)/scores.length;
  const g=grade(avg);
  setResults.push(avg);

  tbody.innerHTML+=`
    <tr>
      <td>${currentSet}</td>
      <td>${reps}</td>
      <td>${avg.toFixed(1)}%</td>
      <td>${g}</td>
    </tr>
  `;

  saveHistory(avg,g);

  if(currentSet < totalSets){
    currentSet++;
    startRest();
  }else{
    finishAll();
  }
}

function startRest(){
  mode="rest";
  timer=REST_TIME;
  feedback.innerText=`⏸️ พัก ${timer} วินาที`;
  interval=setInterval(()=>{
    timer--;
    feedback.innerText=`⏸️ พัก ${timer} วินาที`;
    if(timer<=0){
      clearInterval(interval);
      startCountdown();
    }
  },1000);
}

function finishAll(){
  const avgAll = setResults.reduce((a,b)=>a+b,0)/setResults.length;
  finalScoreBox.innerText = avgAll.toFixed(1)+"%";
  finalGradeBox.innerText = grade(avgAll);

  const today = new Date().toISOString().slice(0,10);
  localStorage.setItem("lastWorkout", JSON.stringify({
    date: today,
    exercise: "squat",
    muscles: exerciseMuscle["squat"]
  }));

  showRecommendation();
  feedback.innerText="✅ ฝึกครบทุกเซตแล้ว";
}

// ================= RECOMMEND =================
function showRecommendation(){
  const last = JSON.parse(localStorage.getItem("lastWorkout")||"{}");
  if(!last.muscles) return;

  if(last.muscles.includes("legs")){
    recommendBox.innerText =
      "🧠 วันนี้เล่นขา → พรุ่งนี้แนะนำ Core หรือ Upper Body";
  }
}

// ================= SAVE =================
function saveHistory(avg, g){
  const log={
    date:new Date().toISOString().slice(0,10),
    avgScore:avg.toFixed(1),
    grade:g
  };
  let history=JSON.parse(localStorage.getItem("poseHistory")||"[]");
  history.push(log);
  localStorage.setItem("poseHistory",JSON.stringify(history));
}
