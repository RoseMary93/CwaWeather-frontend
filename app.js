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

// 🌟 城市經緯度對照表（用以計算日落時間）
const cityCoordinates = {
    taipei: { lat: 25.0330, lng: 121.5654 },
    newtaipei: { lat: 25.0085, lng: 121.4644 },
    keelung: { lat: 25.1276, lng: 121.7397 },
    taoyuan: { lat: 25.0157, lng: 121.3066 },
    hsinchu_city: { lat: 24.8138, lng: 120.9675 },
    hsinchu_county: { lat: 24.8135, lng: 121.0105 },
    miaoli: { lat: 24.5205, lng: 120.8235 },
    taichung: { lat: 24.1372, lng: 120.6738 },
    changhua: { lat: 24.0804, lng: 120.5055 },
    nantou: { lat: 23.8103, lng: 120.9930 },
    yunlin: { lat: 23.7075, lng: 120.4417 },
    chiayi_city: { lat: 23.2692, lng: 120.4437 },
    chiayi_county: { lat: 23.4608, lng: 120.6271 },
    tainan: { lat: 22.9997, lng: 120.2270 },
    kaohsiung: { lat: 22.6163, lng: 120.3006 },
    pingtung: { lat: 22.6800, lng: 120.4891 },
    yilan: { lat: 24.7603, lng: 121.7669 },
    hualien: { lat: 24.1234, lng: 121.6089 },
    taitung: { lat: 22.7696, lng: 120.9721 },
    penghu: { lat: 23.5691, lng: 119.6309 },
    kinmen: { lat: 24.4265, lng: 118.3927 },
    lienchiang: { lat: 26.1609, lng: 119.9592 }
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
// 🌟 新增：計算日落時間
function getSunsetTime(cityKey) {
    try {
        const coords = cityCoordinates[cityKey];
        if (!coords) {
            console.warn(`無法找到 ${cityKey} 的經緯度`);
            return "無法計算";
        }

        const today = new Date();
        const times = SunCalc.getTimes(today, coords.lat, coords.lng);
        const sunset = times.sunset;
        
        // 格式化時間：HH:MM
        const hours = String(sunset.getHours()).padStart(2, '0');
        const minutes = String(sunset.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    } catch (e) {
        console.error("[ERROR] 日落時間計算失敗:", e);
        return "無法計算";
    }
}

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

function renderWeather(data, cityKey = 'taipei') {
    const forecasts = data.forecasts;
    const current = forecasts[0];
    const others = forecasts.slice(1);

    const advice = getAdvice(current.rain, current.maxTemp);
    const period = getTimePeriod(current.startTime);
    const avgTemp = Math.round((parseInt(current.maxTemp) + parseInt(current.minTemp)) / 2);
    const sunsetTime = getSunsetTime(cityKey);

    // 🌟 修正今日焦點卡的描述 + 日落時間
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
                        <div class="advice-item">
                            <div class="advice-icon">🌅</div>
                            <div class="advice-text">日落時間</div>
                            <div class="advice-sub">${sunsetTime}</div>
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

// 🌟 新增：經緯度與縣市的對應關係（邊界判定）
const cityBoundaries = {
    taipei: { lat: [25.0170, 25.1957], lng: [121.4324, 121.6522] },
    newtaipei: { lat: [24.9720, 25.2948], lng: [121.2324, 121.9717] },
    keelung: { lat: [25.0908, 25.2047], lng: [121.1309, 121.4680] },
    taoyuan: { lat: [24.7256, 25.2059], lng: [120.9184, 121.5427] },
    hsinchu_city: { lat: [24.7829, 24.9396], lng: [120.8577, 120.9910] },
    hsinchu_county: { lat: [24.5205, 24.9676], lng: [120.6471, 121.0680] },
    miaoli: { lat: [24.3299, 24.7628], lng: [120.5235, 121.0585] },
    taichung: { lat: [24.0130, 24.5568], lng: [120.3681, 120.9869] },
    changhua: { lat: [23.8076, 24.2230], lng: [120.2605, 120.7730] },
    nantou: { lat: [23.4173, 24.1667], lng: [120.3988, 121.2589] },
    yunlin: { lat: [23.5440, 23.8169], lng: [120.1609, 120.6559] },
    chiayi_city: { lat: [23.2692, 23.3082], lng: [120.3688, 120.4437] },
    chiayi_county: { lat: [23.0302, 23.5866], lng: [120.1282, 120.7985] },
    tainan: { lat: [22.8530, 23.2184], lng: [120.0537, 120.6532] },
    kaohsiung: { lat: [22.2845, 23.0766], lng: [120.0394, 120.9535] },
    pingtung: { lat: [21.9849, 22.8031], lng: [120.4867, 120.9983] },
    yilan: { lat: [24.4598, 24.9520], lng: [121.8242, 122.0738] },
    hualien: { lat: [23.6978, 24.3385], lng: [121.0054, 121.6735] },
    taitung: { lat: [22.3896, 23.0933], lng: [120.8773, 121.5574] },
    penghu: { lat: [23.5691, 23.7769], lng: [119.2870, 119.6309] },
    kinmen: { lat: [24.3945, 24.4828], lng: [118.2342, 118.4522] },
    lienchiang: { lat: [26.0898, 26.2773], lng: [119.8868, 120.0452] }
};

// 🌟 根據經緯度判定縣市
function getCityByCoordinates(lat, lng) {
    for (const [cityKey, bounds] of Object.entries(cityBoundaries)) {
        const [minLat, maxLat] = bounds.lat;
        const [minLng, maxLng] = bounds.lng;
        
        if (lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng) {
            return cityKey;
        }
    }
    // 預設返回台北
    return 'taipei';
}

// 🌟 取得使用者位置
function getUserLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            console.warn('[WARN] 瀏覽器不支援地理位置功能');
            reject(new Error('瀏覽器不支援地理位置功能'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                console.log(`[DEBUG] 取得用戶位置: ${latitude}, ${longitude}`);
                resolve({ latitude, longitude });
            },
            (error) => {
                console.warn('[WARN] 使用者拒絕或無法取得位置:', error.message);
                reject(error);
            },
            {
                enableHighAccuracy: false,
                timeout: 10000,
                maximumAge: 300000 // 5 分鐘內的快取位置
            }
        );
    });
}

// 🌟 使用 Nominatim API 反向地理編碼（精準備選方案）
async function getCityByReverseGeocoding(lat, lng) {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`,
            {
                headers: {
                    'Accept-Language': 'zh-TW'
                }
            }
        );
        const data = await response.json();
        console.log('[DEBUG] Nominatim 回應:', data);
        
        // 從回應中提取縣市名稱
        const address = data.address || {};
        const countyName = address.county || address.state || '';
        
        // 反向對應回縣市 key
        for (const [key, name] of Object.entries(cities)) {
            if (countyName.includes(name)) {
                console.log(`[DEBUG] Nominatim 偵測縣市: ${name}`);
                return key;
            }
        }
        
        console.warn('[WARN] Nominatim 無法對應縣市，使用預設');
        return 'taipei'; // 預設
    } catch (error) {
        console.error('[ERROR] 反向地理編碼失敗:', error);
        return 'taipei';
    }
}

// 🌟 優先用 GPS 邊界判定，失敗時再用 Nominatim API
async function detectCityByLocation() {
    try {
        // 第一步：取得用戶位置
        const location = await getUserLocation();
        const { latitude, longitude } = location;
        
        // 第二步：優先使用 GPS 邊界判定（快速）
        const detectedCity = getCityByCoordinates(latitude, longitude);
        if (detectedCity !== 'taipei' || Math.random() > 0.5) {
            // 邊界判定成功且不是預設值，或隨機決定信任邊界判定
            console.log(`[INFO] 使用 GPS 邊界判定: ${detectedCity}`);
            return detectedCity;
        }
        
        // 第三步：若邊界判定結果是台北，再用 Nominatim API 驗證（精準）
        console.log('[INFO] 邊界判定結果為台北，使用 Nominatim API 驗證...');
        const verifiedCity = await getCityByReverseGeocoding(latitude, longitude);
        return verifiedCity;
        
    } catch (error) {
        console.error('[ERROR] 位置偵測失敗:', error.message);
        return 'taipei'; // 失敗時預設台北
    }
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
            renderWeather(json.data, cityKey);

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

document.addEventListener("DOMContentLoaded", async () => {
    createBubbles(); // 啟動氣泡
    initCitySelect();
    
    // 🌟 新增：嘗試自動偵測用戶位置
    try {
        const detectedCity = await detectCityByLocation();
        const citySelect = document.getElementById('citySelect');
        citySelect.value = detectedCity;
        console.log(`[INFO] 自動加載 ${cities[detectedCity]}`);
        fetchWeather(detectedCity);
    } catch (error) {
        console.log('[INFO] 位置自動偵測失敗，使用預設位置: 台北市');
        fetchWeather('taipei');
    }
});
