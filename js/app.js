// -------------------------------
// CONFIG
// -------------------------------
const WORKER = "https://still-pine-850d.jmelen00.workers.dev/?url=";
const STATION_ID = 221956;      // Live data
const DEVICE_ID = 1231123;      // Historical data
const API_KEY = "15375284-0370-4ba4-be3d-ab6ec4fbed64";

// -------------------------------
// THEME TOGGLE
// -------------------------------
function toggleTheme() {
  document.body.classList.toggle("dark");
  document.body.classList.toggle("light");
}

// -------------------------------
// LOAD LIVE DATA (station endpoint)
// -------------------------------
async function loadTempest() {
  const url = WORKER + encodeURIComponent(
    `https://swd.weatherflow.com/swd/rest/observations/station/${STATION_ID}?token=${API_KEY}`
  );

  const res = await fetch(url);
  const data = await res.json();

  if (!data || !data.obs || !data.obs.length) {
    console.log("No live observations returned:", data);
    return;
  }

  const obs = data.obs[0];

  const tempF = obs.air_temperature * 9/5 + 32;
  const ts = new Date(obs.timestamp * 1000).toLocaleString();

  document.getElementById("timestamp").innerText = `Updated: ${ts}`;
  document.getElementById("temp").innerText = `Temperature: ${tempF.toFixed(1)}°F`;
  document.getElementById("humidity").innerText = `Humidity: ${obs.relative_humidity}%`;
  document.getElementById("wind").innerText = `Wind: ${obs.wind_avg} mph (gust: ${obs.wind_gust} mph)`;
  document.getElementById("pressure").innerText = `Pressure: ${obs.sea_level_pressure} mb`;
  document.getElementById("uv").innerText = `UV Index: ${obs.uv}`;
  document.getElementById("rain").innerText = `Rain Today: ${obs.precip_accum_local_day} in`;
}

// -------------------------------
// LOAD 24-HOUR HISTORY (device endpoint)
// -------------------------------
async function loadHistory() {
  const now = Math.floor(Date.now() / 1000);
  const start = now - 86400; // last 24 hours

  const url = WORKER + encodeURIComponent(
    `https://swd.weatherflow.com/swd/rest/observations/device/${DEVICE_ID}?token=${API_KEY}&time_start=${start}&time_end=${now}`
  );

  const res = await fetch(url);
  const data = await res.json();

  if (!data || !data.obs || !data.obs.length) {
    console.log("No device history returned:", data);
    return;
  }

  const history = data.obs;

  await new Promise(r => setTimeout(r, 100)); // Safari timing fix

  const labels = history.map(o => new Date(o.timestamp * 1000).toLocaleTimeString());
  const temps = history.map(o => (o.air_temperature * 9/5 + 32).toFixed(1));
  const winds = history.map(o => o.wind_avg);
  const rains = history.map(o => o.precip_accum_local_day);

  if (window.tempChart) window.tempChart.destroy();
  if (window.windChart) window.windChart.destroy();
  if (window.rainChart) window.rainChart.destroy();

  window.tempChart = new Chart(document.getElementById("tempChart"), {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Temperature (°F)",
        data: temps,
        borderColor: "#ff9800",
        borderWidth: 2,
        backgroundColor: "rgba(255,152,0,0.2)"
      }]
    }
  });

  window.windChart = new Chart(document.getElementById("windChart"), {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Wind Speed (mph)",
        data: winds,
        borderColor: "#2196f3",
        borderWidth: 2,
        backgroundColor: "rgba(33,150,243,0.2)"
      }]
    }
  });

  window.rainChart = new Chart(document.getElementById("rainChart"), {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Rain (in)",
        data: rains,
        borderColor: "#4caf50",
        borderWidth: 2,
        backgroundColor: "rgba(76,175,80,0.2)"
      }]
    }
  });
}

// -------------------------------
// INITIAL LOAD + AUTO REFRESH
// -------------------------------
loadTempest();
loadHistory();

setInterval(() => {
  loadTempest();
  loadHistory();
}, 60000);
