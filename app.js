// 注意：這裡請維持您的 Server 網址
const API_BASE_URL = "https://rm93-weather.zeabur.app/api/weather/";
const API_WEEKLY_URL = "https://rm93-weather.zeabur.app/api/weekly/";
// const API_BASE_URL = "http://localhost:3000/api/weather/";
// const API_WEEKLY_URL = "http://localhost:3000/api/weekly/";

// 🌟 修正地點名稱，回歸標準城市名稱
const cities = {
    taipei: "臺北市",
    newtaipei: "新北市",
    keelung: "基隆市",
    taoyuan: "桃園市",
    hsinchu_city: "新竹市",
    hsinchu_county: "新竹縣",
    miaoli: "苗栗縣",
    taichung: "臺中市",
    changhua: "彰化縣",
    nantou: "南投縣",
    yunlin: "雲林縣",
    chiayi_city: "嘉義市",
    chiayi_county: "嘉義縣",
    tainan: "臺南市",
    kaohsiung: "高雄市",
    pingtung: "屏東縣",
    yilan: "宜蘭縣",
    hualien: "花蓮縣",
    taitung: "臺東縣",
    penghu: "澎湖縣",
    kinmen: "金門縣",
    lienchiang: "連江縣"
};

// 檢視模式（今日或一週）
let viewMode = "today";

// 產生背景氣泡
function createBubbles() {
    const container = document.getElementById('bubbleContainer');
    const bubbleCount = 15;
    for (let i = 0; i < bubbleCount; i++) {
        const bubble = document.createElement('div');
        bubble.className = 'bubble';
        // 隨機大小
        const size = Math.random() * 20 + 5 + 'px';
        bubble.style.width = size;
        bubble.style.height = size;
        // 隨機位置
        bubble.style.left = Math.random() * 100 + '%';
        // 隨機動畫時間
        bubble.style.animationDuration = (Math.random() * 5 + 5) + 's';
        // 隨機延遲
        bubble.style.animationDelay = Math.random() * 5 + 's';
        container.appendChild(bubble);
    }
}

function initCitySelect() {
    const select = document.getElementById('citySelect');
    for (const [key, name] of Object.entries(cities)) {
        const option = document.createElement('option');
        option.value = key;
        option.text = name;
        select.appendChild(option);
    }
    select.addEventListener('change', (e) => {
        if (viewMode === 'today') {
            fetchWeather(e.target.value);
        } else {
            fetchWeeklyWeather(e.target.value);
        }
    });
}

function getWeatherIcon(weather) {
    if (!weather) return "🌤️";
    if (weather.includes("晴")) return "☀️";
    if (weather.includes("多雲")) return "⛅";
    if (weather.includes("陰")) return "☁️";
    if (weather.includes("雨")) return "🌧️";
    if (weather.includes("雷")) return "⚡";
    return "🌤️";
}

// 🌟 修正建議文字，從「海洋/潛水衣」改為「大氣/衣著」
function getAdvice(rainProb, maxTemp) {
    // 修正降雨建議
    let rainIcon = "💧";
    let rainText = "地面乾燥";
    const prob = parseInt(rainProb);

    if (prob > 60) {
        rainIcon = "☔";
        rainText = "帶傘，注意暴雨";
    } else if (prob > 30) {
        rainIcon = "☂️";
        rainText = "可能需要雨具";
    }

    // 修正穿衣建議 (依氣溫)
    let clothIcon = "👕";
    let clothText = "輕薄衣物即可";
    const temp = parseInt(maxTemp);

    if (temp >= 30) {
        clothIcon = "🥵";
        clothText = "注意防曬中暑";
    } else if (temp >= 26) {
        clothIcon = "👚";
        clothText = "短袖長褲舒適";
    } else if (temp <= 20) {
        clothIcon = "🧥";
        clothText = "需加保暖外套";
    }

    return {
        rainIcon,
        rainText,
        clothIcon,
        clothText
    };
}

// 🌟 修正時段描述，避免誤認為潮汐
function getTimePeriod(startTime) {
    const hour = new Date(startTime).getHours();
    if (hour >= 5 && hour < 11) return "早晨時段";
    if (hour >= 11 && hour < 14) return "中午時段";
    if (hour >= 14 && hour < 18) return "下午時段";
    if (hour >= 18 && hour < 23) return "晚間時段";
    return "深夜時段";
}

// 切換檢視模式
function switchViewMode(mode) {
    viewMode = mode;
    const todayBtn = document.getElementById('todayBtn');
    const weeklyBtn = document.getElementById('weeklyBtn');
    const citySelect = document.getElementById('citySelect');
    const selectedCity = citySelect.value;

    if (mode === 'today') {
        todayBtn.classList.add('active');
        weeklyBtn.classList.remove('active');
        document.getElementById('todayView').style.display = 'block';
        document.getElementById('weeklyView').style.display = 'none';
        fetchWeather(selectedCity);
    } else {
        todayBtn.classList.remove('active');
        weeklyBtn.classList.add('active');
        document.getElementById('todayView').style.display = 'none';
        document.getElementById('weeklyView').style.display = 'block';
        fetchWeeklyWeather(selectedCity);
    }
}

// 渲染一週天氣
function renderWeeklyWeather(data) {
    const container = document.getElementById('weeklyForecasts');
    container.innerHTML = '';

    if (!data || !data.forecasts || data.forecasts.length === 0) {
        container.innerHTML = '<div style="text-align: center; color: #aaa; padding: 20px;">無可用天氣資料</div>';
        return;
    }

    data.forecasts.forEach((day) => {
        const dayCard = document.createElement('div');
        dayCard.className = 'weekly-card';
        dayCard.innerHTML = `
            <div class="weekly-date">${day.date}</div>
            <div class="weekly-day">星期${day.dayOfWeek}</div>
            <div class="weekly-icon">${getWeatherIcon(day.weather)}</div>
            <div class="weekly-weather">${day.weather}</div>
            <div class="weekly-temp">${day.minTemp} ~ ${day.maxTemp}</div>
            <div class="weekly-info">
                <div>💧 ${day.rainProb || '無雨'}</div>
                <div>💨 ${day.windSpeed || '-'} m/s</div>
            </div>
        `;
        container.appendChild(dayCard);
    });

    // 同步繪製兩個折線圖（最高溫 + 降雨機率）
    try {
        renderWeeklyChart(data);
        renderWeeklyRainChart(data);
    } catch (e) {
        console.warn('折線圖渲染失敗:', e);
    }
}

// Chart.js 折線圖實例
let weeklyChartInstance = null;
let weeklyRainChartInstance = null;

function renderWeeklyChart(data) {
    const canvas = document.getElementById('weeklyChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // 🌟 修正日期格式：yyyy-mm-dd → mm/dd(星期)
    const labels = data.forecasts.map(f => {
        const dateObj = new Date(f.date + "T00:00:00");
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        const days = ["日", "一", "二", "三", "四", "五", "六"];
        const dayOfWeek = days[dateObj.getDay()];
        return `${month}/${day}(${dayOfWeek})`;
    });
    
    const maxTemps = data.forecasts.map(f => parseInt(f.maxTemp || 0));
    const minTemps = data.forecasts.map(f => parseInt(f.minTemp || 0));

    if (weeklyChartInstance) {
        weeklyChartInstance.destroy();
        weeklyChartInstance = null;
    }

    weeklyChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: '最高溫 (°C)',
                    data: maxTemps,
                    borderColor: '#00f2ff',
                    backgroundColor: 'rgba(0,242,255,0.12)',
                    tension: 0.25,
                    fill: true,
                    pointRadius: 4,
                    pointBackgroundColor: '#00f2ff'
                },
                {
                    label: '最低溫 (°C)',
                    data: minTemps,
                    borderColor: '#ffd700',
                    backgroundColor: 'rgba(255,215,0,0.08)',
                    tension: 0.25,
                    fill: true,
                    pointRadius: 3,
                    pointBackgroundColor: '#ffd700'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top' }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: { color: '#e0f7fa' }
                },
                x: {
                    ticks: { color: '#e0f7fa' }
                }
            }
        }
    });
}

// 🌟 新增：一週降雨機率折線圖
function renderWeeklyRainChart(data) {
    const canvas = document.getElementById('weeklyRainChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // 日期格式：mm/dd(星期)
    const labels = data.forecasts.map(f => {
        const dateObj = new Date(f.date + "T00:00:00");
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        const days = ["日", "一", "二", "三", "四", "五", "六"];
        const dayOfWeek = days[dateObj.getDay()];
        return `${month}/${day}(${dayOfWeek})`;
    });

    const rainProbs = data.forecasts.map(f => {
        const prob = f.rainProb ? parseInt(f.rainProb) : 0;
        return prob;
    });

    if (weeklyRainChartInstance) {
        weeklyRainChartInstance.destroy();
        weeklyRainChartInstance = null;
    }

    weeklyRainChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: '降雨機率 (%)',
                    data: rainProbs,
                    borderColor: '#00bfff',
                    backgroundColor: 'rgba(0,191,255,0.15)',
                    tension: 0.25,
                    fill: true,
                    pointRadius: 4,
                    pointBackgroundColor: '#00bfff'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top' }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: { color: '#e0f7fa' }
                },
                x: {
                    ticks: { color: '#e0f7fa' }
                }
            }
        }
    });
}

// 取得一週天氣
async function fetchWeeklyWeather(cityKey = 'taipei') {
    const loading = document.getElementById('loading');
    const mainContent = document.getElementById('mainContent');

    loading.style.display = 'flex';
    loading.classList.remove('hidden');
    mainContent.style.display = 'none';

    try {
        const delayPromise = new Promise(resolve => setTimeout(resolve, 1000));
        const fetchPromise = fetch(API_WEEKLY_URL + cityKey).then(res => {
            if (!res.ok) {
                throw new Error(`API fail: ${res.status}`);
            }
            return res.json();
        });

        const [_, json] = await Promise.all([delayPromise, fetchPromise]);

        console.log("[DEBUG] 一週天氣 API 回應:", json);

        if (json.success && json.data) {
            renderWeeklyWeather(json.data);
            loading.classList.add('hidden');
            setTimeout(() => {
                loading.style.display = 'none';
            }, 500);
            mainContent.style.display = 'block';

            // 更新日期
            const now = new Date();
            const year = now.getFullYear();
            const month = now.getMonth() + 1;
            const date = now.getDate();
            document.getElementById('updateTime').textContent = `${year}/${month}/${date}`;
        } else {
            throw new Error(`API Error: ${json.error || '未知錯誤'}`);
        }
    } catch (e) {
        console.error("[ERROR] 一週天氣取得失敗:", e);
        alert("聲納系統異常，請檢查網路連線！\n錯誤: " + e.message);
        loading.style.display = 'none';
        mainContent.style.display = 'block';
    }
}

function renderWeather(data) {
    const forecasts = data.forecasts;
    const current = forecasts[0];
    const others = forecasts.slice(1);

    const advice = getAdvice(current.rain, current.maxTemp);
    const period = getTimePeriod(current.startTime);
    const avgTemp = Math.round((parseInt(current.maxTemp) + parseInt(current.minTemp)) / 2);

    // 🌟 修正今日焦點卡的描述
    document.getElementById('heroCard').innerHTML = `
                <div class="hero-card">
                    <div class="hero-period">CURRENT | ${period}</div>
                    <div class="hero-temp-container">
                        <div class="hero-icon">${getWeatherIcon(current.weather)}</div>
                        <div class="hero-temp">${avgTemp} °C</div>
                    </div>
                    <div class="hero-desc">${current.weather}</div>
                    
                    <div class="advice-grid">
                        <div class="advice-item">
                            <div class="advice-icon">${advice.rainIcon}</div>
                            <div class="advice-text">${advice.rainText}</div>
                            <div class="advice-sub">降雨機率 ${current.rain}</div> 
                        </div>
                        <div class="advice-item">
                            <div class="advice-icon">${advice.clothIcon}</div>
                            <div class="advice-text">${advice.clothText}</div>
                            <div class="advice-sub">最高氣溫 ${current.maxTemp}</div>
                        </div>
                    </div>
                </div>
            `;

    const scrollContainer = document.getElementById('futureForecasts');
    scrollContainer.innerHTML = '';
    const todayDate = new Date().getDate();

    others.forEach(f => {
        let p = getTimePeriod(f.startTime);
        const fDate = new Date(f.startTime);
        if (fDate.getDate() !== todayDate) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            if (fDate.getDate() === tomorrow.getDate()) {
                 p = "明日" + p;
            } else {
                p = `${fDate.getMonth() + 1}/${fDate.getDate()} ${p}`;
            }
           
        }

        scrollContainer.innerHTML += `
                    <div class="mini-card">
                        <div class="mini-time">${p}</div>
                        <div class="mini-icon">${getWeatherIcon(f.weather)}</div>
                        <div class="mini-weather-desc">${f.weather}</div>
                        <div class="mini-temp">${f.minTemp} - ${f.maxTemp}</div>
                        <div class="mini-rain">💧 降雨機率 ${f.rain}</div>
                    </div>
                `;
    });

    // 右上角時間
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const date = now.getDate();
    document.getElementById('updateTime').textContent = `${year}/${month}/${date}`;
}

async function fetchWeather(cityKey = 'taipei') {
    const loading = document.getElementById('loading');
    const mainContent = document.getElementById('mainContent');

    loading.style.display = 'flex';
    loading.classList.remove('hidden');
    mainContent.style.display = 'none';

    try {
        // 為了讓動畫跑完，加入至少 1 秒的延遲
        const delayPromise = new Promise(resolve => setTimeout(resolve, 1000));
        const fetchPromise = fetch(API_BASE_URL + cityKey).then(res => {
            if (!res.ok) throw new Error("API fail");
            return res.json();
        });

        const [_, json] = await Promise.all([delayPromise, fetchPromise]);

        if (json.success) {
            renderWeather(json.data);

            loading.classList.add('hidden');
            setTimeout(() => {
                loading.style.display = 'none';
            }, 500);
            mainContent.style.display = 'block';
        } else {
            throw new Error("API Error");
        }
    } catch (e) {
        console.error(e);
        alert("聲納系統異常，請檢查網路連線！");
        loading.style.display = 'none';
        mainContent.style.display = 'block';
    }
}

document.addEventListener("DOMContentLoaded", () => {
    createBubbles(); // 啟動氣泡
    initCitySelect();
    fetchWeather();
});
