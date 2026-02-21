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
// 🌟 記錄目前偵測到的鄉鎮
let currentTown = "";

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

/**
 * 取得指定縣市的鄉鎮列表並填充下拉選單
 */
async function populateTowns(cityKey, selectedTown = "") {
    const townSelect = document.getElementById('townSelect');
    if (!townSelect) return;

    townSelect.innerHTML = '<option value="">(未指定區域)</option>';

    try {
        const res = await fetch(`http://localhost:3000/api/towns/${cityKey}`);
        const json = await res.json();

        if (json.success && json.towns) {
            json.towns.forEach(town => {
                const opt = document.createElement('option');
                opt.value = town;
                opt.text = town;
                townSelect.appendChild(opt);
            });

            // 🌟 核心匹配邏輯：將 GPS 偵測地名與 CWA 合法列表比對
            if (selectedTown) {
                const norm = (s) => s.replace(/[臺]/g, '台').replace(/[區鄉鎮市]$/, '');
                const cleanSelected = norm(selectedTown);

                const matchedTown = json.towns.find(t => {
                    const normT = norm(t);
                    return normT.includes(cleanSelected) || cleanSelected.includes(normT);
                });

                if (matchedTown) {
                    townSelect.value = matchedTown;
                    currentTown = matchedTown;
                    console.log(`[INFO] 成功將 GPS (${selectedTown}) 對應至氣象區: ${matchedTown}`);
                } else {
                    console.log(`[WARN] 無法在氣象局列表中找到對應區域: ${selectedTown}，回退至全境預報`);
                    townSelect.value = "";
                    currentTown = "";
                }
            } else {
                townSelect.value = "";
                currentTown = "";
            }
        }
    } catch (e) {
        console.error("[ERROR] 無法取得鄉鎮列表:", e);
    }
}

function initCitySelect() {
    const citySelect = document.getElementById('citySelect');
    const townSelect = document.getElementById('townSelect');

    for (const [key, name] of Object.entries(cities)) {
        const option = document.createElement('option');
        option.value = key;
        option.text = name;
        citySelect.appendChild(option);
    }

    // 縣市切換
    citySelect.addEventListener('change', async (e) => {
        const cityKey = e.target.value;
        currentTown = "";
        await populateTowns(cityKey);

        if (viewMode === 'today') {
            fetchWeather(cityKey, "", "switch");
        } else {
            fetchWeeklyWeather(cityKey, "", "switch");
        }
    });

    // 鄉鎮切換
    townSelect.addEventListener('change', (e) => {
        currentTown = e.target.value;
        const cityKey = citySelect.value;
        if (viewMode === 'today') {
            fetchWeather(cityKey, currentTown, "switch");
        } else {
            fetchWeeklyWeather(cityKey, currentTown, "switch");
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
    } else {
        rainIcon = "☀️";
        rainText = "地面乾燥";
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

// 🌟 修正時段描述：深夜(22~04)、清晨(04~10)、午間(10~16)、晚間(16~22)
function getTimePeriod(startTime) {
    const hour = new Date(startTime).getHours();
    if (hour >= 4 && hour < 10) return "清晨時段";
    if (hour >= 10 && hour < 16) return "午間時段";
    if (hour >= 16 && hour < 22) return "晚間時段";
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
        fetchWeather(selectedCity, currentTown);
    } else {
        todayBtn.classList.remove('active');
        weeklyBtn.classList.add('active');
        document.getElementById('todayView').style.display = 'none';
        document.getElementById('weeklyView').style.display = 'block';
        fetchWeeklyWeather(selectedCity, currentTown);
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

    // 更新地點顯示
    const siteTitle = document.querySelector('.site-title');
    const townSelect = document.getElementById('townSelect');

    if (siteTitle) {
        const cleanCity = data.city.replace('臺', '台');
        const cleanTown = data.town ? data.town.replace('臺', '台') : '';
        const display = (cleanTown && cleanTown !== cleanCity && !cleanCity.includes(cleanTown) && !cleanTown.includes(cleanCity))
            ? `${data.city} ${data.town}`
            : data.city;
        siteTitle.textContent = display;
    }

    // 🌟 修正 3：若無法依據鄉鎮區判斷（data.town 為空），則隱藏選單 (僅在一週預報模式下)
    if (townSelect) {
        if (viewMode === 'weekly') {
            townSelect.style.display = data.town ? 'block' : 'none';
        } else {
            townSelect.style.display = 'block';
        }
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
async function fetchWeeklyWeather(cityKey = 'taipei', townName = '', source = '') {
    const loading = document.getElementById('loading');
    const mainContent = document.getElementById('mainContent');

    loading.style.display = 'flex';
    loading.classList.remove('hidden');
    mainContent.style.display = 'none';

    try {
        const delayPromise = new Promise(resolve => setTimeout(resolve, 1000));
        let url = API_WEEKLY_URL + cityKey;
        const params = new URLSearchParams();
        if (townName) params.append('town', townName);
        if (source) params.append('source', source);

        const queryString = params.toString();
        if (queryString) url += `?${queryString}`;

        const fetchPromise = fetch(url).then(res => {
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
    const nowTime = new Date();
    const forecasts = data.forecasts;

    // 1. 找出當下小時 (Hero Card) - 若超過整點(如17:11)則看向下一小時(18:00)
    const currentHourStart = new Date(nowTime.getFullYear(), nowTime.getMonth(), nowTime.getDate(), nowTime.getHours() + (nowTime.getMinutes() > 0 ? 1 : 0)).getTime();

    let currentIndex = forecasts.findIndex(f => new Date(f.startTime).getTime() === currentHourStart);

    // 如果找不到指定的下一個小時，則回退尋找涵蓋目前的，或取第一個
    if (currentIndex === -1) {
        currentIndex = forecasts.findIndex(f => new Date(f.startTime) <= nowTime && new Date(f.endTime) > nowTime);
    }
    if (currentIndex === -1) currentIndex = 0;
    const current = forecasts[currentIndex];

    // 2. 聚合 6 小時時段預報 (Sonar Area)
    const getBucketInfo = (d) => {
        const h = d.getHours();
        // 🌟 核心：跨午夜聚合邏輯。將 00:00~04:00 視為「前一天」的深夜時段
        const logicDate = new Date(d);
        if (h < 4) {
            logicDate.setDate(logicDate.getDate() - 1);
        }
        const dayKey = logicDate.toDateString();

        if (h >= 4 && h < 10) return { id: 1, name: "清晨時段", dayKey };
        if (h >= 10 && h < 16) return { id: 2, name: "午間時段", dayKey };
        if (h >= 16 && h < 22) return { id: 3, name: "晚間時段", dayKey };
        return { id: 0, name: "深夜時段", dayKey };
    };

    const currentPeriodInfo = getBucketInfo(new Date(current.startTime));
    const bucketMap = {};

    forecasts.forEach((f) => {
        const fDate = new Date(f.startTime);
        const p = getBucketInfo(fDate);
        const key = `${p.dayKey}_${p.id}`;

        // 🌟 跳過「目前時段」所屬的整個 6 小時大區塊 (依據邏輯日期與ID)
        if (p.dayKey === currentPeriodInfo.dayKey && p.id === currentPeriodInfo.id) return;

        // 確保不顯示已過去的資料
        if (fDate.getTime() < currentHourStart) return;

        if (!bucketMap[key]) {
            bucketMap[key] = {
                name: p.name,
                startTime: f.startTime,
                weather: f.weather,
                minTemp: 99,
                maxTemp: -99,
                maxRain: 0
            };
        }

        const tMin = parseInt(f.minTemp || f.maxTemp || 0);
        const tMax = parseInt(f.maxTemp || f.minTemp || 0);
        const rain = parseInt(f.rain || 0);

        if (tMin < bucketMap[key].minTemp) bucketMap[key].minTemp = tMin;
        if (tMax > bucketMap[key].maxTemp) bucketMap[key].maxTemp = tMax;
        if (rain > bucketMap[key].maxRain) bucketMap[key].maxRain = rain;
    });

    // 取得接下來 2 個桶子
    const others = Object.values(bucketMap)
        .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
        .slice(0, 2)
        .map(b => ({
            startTime: b.startTime,
            weather: b.weather,
            minTemp: b.minTemp + "°C",
            maxTemp: b.maxTemp + "°C",
            rain: b.maxRain + "%"
        }));

    const advice = getAdvice(current.rain, current.maxTemp);
    const period = "目前時段";
    const avgTemp = Math.round((parseInt(current.maxTemp) + parseInt(current.minTemp)) / 2);
    const sunsetTime = getSunsetTime(cityKey);

    // 更新地點顯示
    const siteTitle = document.querySelector('.site-title');
    const townSelect = document.getElementById('townSelect');

    if (siteTitle) {
        const cleanCity = data.city.replace('臺', '台');
        const cleanTown = data.town ? data.town.replace('臺', '台') : '';
        const display = (cleanTown && cleanTown !== cleanCity && !cleanCity.includes(cleanTown) && !cleanTown.includes(cleanCity))
            ? `${data.city} ${data.town}`
            : data.city;
        siteTitle.textContent = display;
    }

    // 今日預報模式下，確保鄉鎮選單可見
    if (townSelect) {
        townSelect.style.display = 'block';
    }


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

    // 🌟 修正：僅顯示下 2 個時段
    const limitedOthers = others.slice(0, 2);

    limitedOthers.forEach(f => {
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
    const updateTimeObj = new Date();
    const year = updateTimeObj.getFullYear();
    const month = updateTimeObj.getMonth() + 1;
    const date = updateTimeObj.getDate();
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
            return reject(new Error("瀏覽器不支援定位"));
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => resolve(pos.coords),
            (err) => reject(err),
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    });
}

// 🌟 使用 Nominatim API 反向地理編碼（精準備選方案，支援鄉鎮市區）
async function getCityByReverseGeocoding(lat, lng) {
    try {
        // 🌟 提升縮放層級至 18 以獲得更精確的街道/區塊資訊
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
            {
                headers: {
                    'Accept-Language': 'zh-TW'
                }
            }
        );
        const data = await response.json();
        const address = data.address || {};

        // 🌟 正規化：將所有臺統一轉為台以利判定
        const norm = (str) => (str || '').replace(/臺/g, '台');

        const rawState = norm(address.state);
        const rawCity = norm(address.city);
        const rawCounty = norm(address.county);

        // 鄉鎮級欄位排序 (由小至大嘗試)
        const rawTown = address.suburb || address.city_district || address.district || address.town || address.village || address.neighbourhood || address.hamlet || '';
        const normTown = norm(rawTown);

        console.log(`[DEBUG] 定位詳細資訊:`, address);

        // 1. 判定縣市 (CityKey)
        const fullAddressStr = norm(rawState + rawCity + rawCounty);
        let detectedCityKey = 'taipei';

        for (const [key, name] of Object.entries(cities)) {
            const normName = norm(name);
            if (fullAddressStr.includes(normName) || normName.includes(fullAddressStr)) {
                detectedCityKey = key;
                break;
            }
        }

        // 2. 判定鄉鎮 (TownName)
        let cleanTown = rawTown;
        const normCityNameForMatch = norm(cities[detectedCityKey]);

        // 如果抓到的鄉鎮名包含縣市名，或者就是縣市名，則過濾掉
        if (normTown === normCityNameForMatch || normTown.length < 2) {
            cleanTown = "";
        }

        console.log(`[INFO] 定位解碼結果: ${cities[detectedCityKey]} / ${cleanTown || '(全境預報)'}`);
        return { cityKey: detectedCityKey, townName: cleanTown };
    } catch (error) {
        console.error('[ERROR] 反向地理編碼失敗:', error);
        return { cityKey: 'taipei', townName: '' };
    }
}

// 🌟 優先用 GPS 邊界判定，失敗時再用 Nominatim API
async function detectCityByLocation() {
    try {
        const location = await getUserLocation();
        const { latitude, longitude } = location;

        console.log(`[INFO] 偵測用戶位置: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        const result = await getCityByReverseGeocoding(latitude, longitude);
        return result;

    } catch (error) {
        console.error('[ERROR] 位置偵測失敗:', error.message);
        currentTown = "";
        return { cityKey: 'taipei', townName: '' };
    }
}

async function fetchWeather(cityKey = 'taipei', townName = '', source = '') {
    const loading = document.getElementById('loading');
    const mainContent = document.getElementById('mainContent');

    loading.style.display = 'flex';
    loading.classList.remove('hidden');
    mainContent.style.display = 'none';

    try {
        const delayPromise = new Promise(resolve => setTimeout(resolve, 1000));
        let url = API_BASE_URL + cityKey;
        const params = new URLSearchParams();
        if (townName) params.append('town', townName);
        if (source) params.append('source', source);

        const queryString = params.toString();
        if (queryString) url += `?${queryString}`;

        const fetchPromise = fetch(url).then(res => {
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

    // 🌟 嘗試自動偵測用戶位置（縣市+鄉鎮）
    try {
        const { cityKey, townName } = await detectCityByLocation();

        // 更新 UI
        const citySelect = document.getElementById('citySelect');
        citySelect.value = cityKey;
        await populateTowns(cityKey, townName);

        console.log(`[INFO] 自動加載 ${cities[cityKey]} ${currentTown || '(全境)'}`);
        fetchWeather(cityKey, currentTown, "gps");
    } catch (error) {
        console.log('[INFO] 位置自動偵測失敗，使用預設位置: 台北市');
        await populateTowns('taipei');
        fetchWeather('taipei', '', "gps");
    }
});
