function saveProfile(){
  const old = JSON.parse(localStorage.getItem("userProfile") || "{}");

  const name = document.getElementById("name").value;
  const weight = Number(document.getElementById("weight").value);
  const heightCm = Number(document.getElementById("height").value);
  const target = Number(document.getElementById("target").value);

  const heightM = heightCm / 100;
  const bmi = (weight / (heightM * heightM)).toFixed(1);

  let status = "อ้วน";
  if(bmi < 18.5) status = "ผอม";
  else if(bmi < 25) status = "ปกติ";

  const profile = {
    name,
    startWeight: old.startWeight || weight, // ⭐ สำคัญมาก
    weight,
    heightCm,
    target,
    bmi,
    status
  };

  localStorage.setItem("userProfile", JSON.stringify(profile));

  document.getElementById("bmiResult").innerText =
    `BMI = ${bmi} (${status})`;
}
