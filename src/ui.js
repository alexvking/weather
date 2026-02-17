
import Chart from 'chart.js/auto';
import { getIcon, getWeatherLabel } from './icons.js';

function formatDate(isoString) {
    // Treat YYYY-MM-DD as local date, not UTC
    // "2026-02-15" should be Feb 15 in local timezone, not UTC
    const [year, month, day] = isoString.split('-').map(Number);
    const date = new Date(year, month - 1, day); // Month is 0-indexed
    return {
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dateStr: date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })
    };
}

let charts = [];

export function renderHeader(locationData) {
    document.getElementById('location-name').textContent = `${locationData.name}, ${locationData.admin1 || ''} ${locationData.country_code || ''}`;
    if (locationData.elevation !== undefined) {
        document.getElementById('elevation').textContent = `Elev: ${locationData.elevation}ft`;
    }
    document.title = `${locationData.name} Weather`;
}

export function renderDailyForecast(daily) {
    const container = document.getElementById('daily-summary');
    container.innerHTML = '';

    // Filter to start from today in the target timezone
    // We'll pass the first day of the hourly data slice to ensure perfect alignment
    // or just use the same logic if utcOffset is available.
    // For now, let's just make it pick the same first day as the charts.
    // We'll update main.js to pass the calculated start date if needed, 
    // but a simpler way is to find the first day that has data for "now" in target TZ.
    const nowUtc = Date.now();
    const localNow = new Date(nowUtc + (daily.utcOffsetSeconds || 0) * 1000); // We'll add this to the API call or pass it
    const localTodayStr = localNow.toISOString().split('T')[0];

    let startIndex = 0;
    for (let i = 0; i < daily.time.length; i++) {
        if (daily.time[i] >= localTodayStr) {
            startIndex = i;
            break;
        }
    }

    for (let i = startIndex; i < daily.time.length; i++) {
        const { dayName, dateStr } = formatDate(daily.time[i]);
        const max = Math.round(daily.temperature_2m_max[i]);
        const min = Math.round(daily.temperature_2m_min[i]);
        const precip = daily.precipitation_sum[i];
        const precipFormatted = precip > 0 ? precip.toFixed(2) + ' in' : '';
        const iconSvg = getIcon(daily.weather_code[i]);

        const card = document.createElement('div');
        card.className = 'day-card';
        card.innerHTML = `
      <span class="day-name">${dayName}</span>
      <span class="date">${dateStr}</span>
      <span class="temps">
        <span class="high">${max}°</span> | <span class="low">${min}°</span>
      </span>
      <div class="weather-icon-container">${iconSvg}</div>
      <span class="weather-label" style="display:block; font-size:0.8rem; color:#666; margin-bottom:4px;">${getWeatherLabel(daily.weather_code[i])}</span>
      <span class="precip-summary">${precipFormatted}</span>
    `;
        container.appendChild(card);
    }
}

export function renderCharts(hourlyData, utcOffsetSeconds = 0) {
    charts.forEach(c => c.destroy());
    charts = [];

    // 1. Data Cleaning: Start from midnight of today in the target timezone
    const nowUtc = Date.now();
    const localNow = new Date(nowUtc + (utcOffsetSeconds * 1000));
    const localTodayStr = localNow.toISOString().split('T')[0];

    console.log('Target Local Today:', localTodayStr);

    // Find index corresponding to midnight of today in local time
    let startIndex = 0;
    for (let i = 0; i < hourlyData.time.length; i++) {
        if (hourlyData.time[i].startsWith(localTodayStr)) {
            startIndex = i;
            break;
        }
    }

    // Safety check: if localTodayStr is not found (e.g. data starts later), 
    // just start from index 0.
    if (startIndex === 0 && !hourlyData.time[0].startsWith(localTodayStr)) {
        console.warn('Local today not found in hourly data, starting from 0');
    }

    // Helper to slice data - 241 points to cover 10 full days (240 intervals)
    // 241st point is 12 AM of the 11th day, providing the final boundary.
    const slice = (arr) => arr.slice(startIndex, startIndex + 241);

    const hourly = {
        time: slice(hourlyData.time),
        temperature_2m: slice(hourlyData.temperature_2m),
        apparent_temperature: slice(hourlyData.apparent_temperature),
        dew_point_2m: slice(hourlyData.dew_point_2m),
        precipitation_probability: slice(hourlyData.precipitation_probability),
        precipitation: slice(hourlyData.precipitation),
        rain: slice(hourlyData.rain),
        showers: slice(hourlyData.showers),
        snowfall: slice(hourlyData.snowfall),
        cloud_cover: slice(hourlyData.cloud_cover),
        relative_humidity_2m: slice(hourlyData.relative_humidity_2m),
        surface_pressure: slice(hourlyData.surface_pressure),
        wind_speed_10m: slice(hourlyData.wind_speed_10m)
    };

    // Debug logging for X-axis labels
    console.log('--- RenderCharts Debug ---');
    console.log('Hourly Time (start):', hourly.time.slice(0, 5));
    console.log('Hourly Time (end):', hourly.time.slice(-5));
    console.log('UTC Offset:', utcOffsetSeconds);

    // Fixed labels count (240 hours)
    const labels = hourly.time.map(t => {
        // Parse "YYYY-MM-DDTHH:mm" manually to avoid any timezone shift
        const [datePart, timePart] = t.split('T');
        const [year, month, day] = datePart.split('-').map(Number);
        const [hour, min] = timePart.split(':').map(Number);
        const localDate = new Date(year, month - 1, day, hour, min);

        const ampm = hour >= 12 ? 'PM' : 'AM';
        const h = hour % 12 || 12;

        if (hour === 0) {
            return localDate.toLocaleDateString('en-US', { weekday: 'short' }) + ' 12 AM';
        }
        return `${h} ${ampm}`;
    });

    // --- PLUGINS ---

    // 1. Chart Alignment (Fixed Y-Axis Width)
    const fixedYAxisWidthPlugin = {
        id: 'fixedYAxisWidth',
        afterFit: (axis) => {
            if (axis.id === 'y' || axis.id === 'y1') {
                axis.width = 50;
            }
        }
    };

    // 2. Vertical Line (Current Location Time - Solid Black) - REMOVED
    // Replaced by DOM-based continuous line in main.js
    // We export the chart instances so main.js can calculate the position.

    // 3. Sync Cursor (Orange Line) - REMOVED
    // Replaced by DOM-based continuous crosshair in main.js

    // 4. Background Shading (Day/Night)
    const backgroundShadingPlugin = {
        id: 'backgroundShading',
        beforeDraw: (chart) => {
            const ctx = chart.ctx;
            const xAxis = chart.scales.x;
            const yAxis = chart.scales.y;

            // Iterate through time to find "night" hours (6pm to 6am)
            hourly.time.forEach((t, i) => {
                if (i >= hourly.time.length - 1) return; // Skip last point as it's the right boundary

                // Extract hour directly from string "YYYY-MM-DDTHH:mm"
                const hour = parseInt(t.split('T')[1].split(':')[0], 10);

                // Night: 18 (6pm) to 6 (6am)
                const isNight = hour >= 18 || hour < 6;

                if (isNight) {
                    const xStart = xAxis.getPixelForValue(i);
                    const xEnd = xAxis.getPixelForValue(i + 1);
                    const width = xEnd - xStart;

                    if (width > 0) {
                        ctx.fillStyle = 'rgba(240, 240, 240, 0.6)'; // Light Grey
                        ctx.fillRect(xStart, yAxis.top, width, yAxis.bottom - yAxis.top);
                    }
                }
            });
        }
    };

    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index',
            intersect: false,
        },
        hover: {
            mode: 'index',
            intersect: false
        },
        plugins: {
            legend: {
                display: !document.body.classList.contains('ultra-dense'),
                position: 'top',
                align: 'end',
                labels: { boxWidth: 12, usePointStyle: true }
            },
            tooltip: {
                mode: 'index',
                intersect: false,
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: '#fff',
                bodyColor: '#fff',
                callbacks: {
                    title: (items) => {
                        const t = hourly.time[items[0].dataIndex];
                        const [datePart, timePart] = t.split('T');
                        const [year, month, day] = datePart.split('-').map(Number);
                        const [hour, min] = timePart.split(':').map(Number);
                        const localD = new Date(year, month - 1, day, hour, min);
                        // Format: "Mon, 3 PM"
                        return localD.toLocaleDateString('en-US', { weekday: 'short' }) + ', ' + localD.toLocaleTimeString('en-US', { hour: 'numeric' });
                    }
                }
            }
        },
        elements: {
            line: { borderWidth: 1.5 },
            point: { radius: 0, hoverRadius: 4 }
        },
        scales: {
            x: {
                grid: { drawOnChartArea: true, color: '#f0f0f0' },
                offset: false, // Ensure grid lines align with start of interval
                ticks: {
                    maxRotation: 0,
                    autoSkip: false,
                    maxTicksLimit: 11,
                    callback: function (value, index) {
                        if (index % 24 === 0) {
                            return this.getLabelForValue(value);
                        }
                        return null;
                    }
                },
                bounds: 'ticks'
            },
            y: {
                beginAtZero: false,
                grid: { color: '#f0f0f0' },
                afterFit: (axis) => { axis.width = 50; }
            }
        },
        onHover: (event, activeElements, chart) => {
            // Sync logic could go here, loop through other charts and calling chart.tooltip.setActiveElements
            // For simplicity in this iteration, we focus on the visual alignment and per-chart crosshair.
            // True multi-chart sync requires keeping ref to all charts.
            if (activeElements && activeElements.length > 0) {
                const index = activeElements[0].index;
                charts.forEach(c => {
                    if (c !== chart) {
                        c.setActiveElements([{ datasetIndex: 0, index }]);
                        c.tooltip.setActiveElements([{ datasetIndex: 0, index }]);
                        c.render();
                    }
                });
            }
        }
    };

    // Note: verticalLinePlugin removed - now using continuous time line drawn in main.js
    // Note: verticalLinePlugin and crosshairPlugin removed - both now using continuous DOM lines
    const plugins = [fixedYAxisWidthPlugin, backgroundShadingPlugin];

    // Sync logic for multi-chart layout consistency
    commonOptions.layout = { padding: { right: 50, left: 0 } };

    // --- Chart 1: Temperature ---
    const ctxTemp = document.getElementById('tempChart').getContext('2d');
    charts.push(new Chart(ctxTemp, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Temperature (°F)',
                    data: hourly.temperature_2m,
                    borderColor: '#d32f2f',
                    backgroundColor: '#d32f2f',
                    tension: 0.4
                },
                {
                    label: 'Feels Like (°F)',
                    data: hourly.apparent_temperature,
                    borderColor: '#7b1fa2',
                    backgroundColor: '#7b1fa2',
                    tension: 0.4
                },
                {
                    label: 'Dew Point (°F)',
                    data: hourly.dew_point_2m,
                    borderColor: '#388e3c',
                    backgroundColor: '#388e3c',
                    tension: 0.4
                }
            ]
        },
        options: {
            ...commonOptions,
            plugins: { ...commonOptions.plugins, title: { display: false } }
        },
        plugins: plugins
    }));

    // --- Chart 2: Atmosphere (Precip Prob, Cloud, Humidity) ---
    const ctxAtmos = document.getElementById('atmosphereChart').getContext('2d');
    // For Atmosphere, we want 0-100 fixed scaling mostly
    // But pressure is on right axis.

    // We need "Precip Line Color" to be segmented.
    // purple if snow > 0, blue otherwise.

    const precipSegment = {
        borderColor: ctx => {
            const i = ctx.p0DataIndex;
            const snow = hourly.snowfall[i];
            return snow > 0 ? '#7b1fa2' : '#2196f3'; // Purple : Blue
        }
    };

    charts.push(new Chart(ctxAtmos, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Precip Probability (%)',
                    data: hourly.precipitation_probability,
                    borderColor: '#2196f3',
                    backgroundColor: 'transparent',
                    tension: 0.4,
                    yAxisID: 'y',
                    order: 1
                },
                {
                    // Shaded blocks for precip type
                    label: 'Precip Shading',
                    data: hourly.precipitation_probability.map(v => v > 0 ? v : 0),
                    type: 'bar',
                    backgroundColor: (ctx) => {
                        const i = ctx.dataIndex;
                        const snow = hourly.snowfall[i];
                        const prob = hourly.precipitation_probability[i];
                        if (prob <= 0) return 'transparent';
                        return snow > 0 ? 'rgba(123, 31, 162, 0.4)' : 'rgba(33, 150, 243, 0.4)';
                    },
                    barPercentage: 1.0,
                    categoryPercentage: 1.0,
                    yAxisID: 'y',
                    order: 2,
                    hidden: false // We can hide from legend in options
                },
                {
                    label: 'Cloud Cover (%)',
                    data: hourly.cloud_cover,
                    borderColor: '#9e9e9e',
                    backgroundColor: 'rgba(158, 158, 158, 0.2)',
                    fill: { target: 'origin', above: 'rgba(158, 158, 158, 0.2)' },
                    tension: 0.4,
                    yAxisID: 'y'
                },
                {
                    label: 'Humidity (%)',
                    data: hourly.relative_humidity_2m,
                    borderColor: '#4caf50',
                    borderDash: [5, 5],
                    tension: 0.4,
                    yAxisID: 'y'
                },
                {
                    label: 'Pressure (inHg)',
                    data: hourly.surface_pressure,
                    borderColor: '#000',
                    tension: 0.4,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            ...commonOptions,
            layout: { padding: { right: 0, left: 0 } },
            plugins: {
                ...commonOptions.plugins,
                legend: {
                    ...commonOptions.plugins.legend,
                    labels: {
                        ...commonOptions.plugins.legend.labels,
                        filter: (item) => item.text !== 'Precip Shading'
                    }
                }
            },
            scales: {
                x: commonOptions.scales.x,
                y: {
                    ...commonOptions.scales.y,
                    max: 100,
                    min: 0,
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    grid: { drawOnChartArea: false },
                    title: { display: true, text: 'Hg' },
                    afterFit: (axis) => { axis.width = 50; }
                }
            }
        },
        plugins: plugins
    }));

    // --- Chart 3: Precipitation Accumulation & Hourly ---
    const ctxPrecip = document.getElementById('precipAmountChart').getContext('2d');

    // Accumulation
    let accumulation = [];
    let rollingSum = 0;
    if (hourly.precipitation) {
        accumulation = hourly.precipitation.map(val => {
            rollingSum += val;
            // Round to 2 decimals for data
            return parseFloat(rollingSum.toFixed(2));
        });
    }

    // Formatting tooltip to add Emoji
    const precipTooltip = {
        callbacks: {
            label: (context) => {
                let label = context.dataset.label || '';
                if (label) {
                    label += ': ';
                }
                if (context.parsed.y !== null) {
                    label += context.parsed.y.toFixed(2) + ' in';
                    // Add Emoji
                    const i = context.dataIndex;
                    const snow = hourly.snowfall[i];
                    if (snow > 0) label += ' ❄️';
                    else if (context.parsed.y > 0) label += ' 💧';
                }
                return label;
            }
        }
    };

    charts.push(new Chart(ctxPrecip, {
        type: 'bar',
        data: {
            labels,
            datasets: [
                {
                    label: 'Hourly Liquid Precip (in)',
                    data: hourly.precipitation,
                    backgroundColor: '#388e3c', // Green
                    borderColor: '#388e3c',
                    borderWidth: 1,
                    type: 'bar',
                    yAxisID: 'y'
                },
                {
                    label: 'Precip Accum. Total (in)',
                    data: accumulation,
                    borderColor: '#0288d1',
                    backgroundColor: 'rgba(2, 136, 209, 0.2)',
                    fill: 'start',
                    type: 'line',
                    yAxisID: 'y'
                }
            ]
        },
        options: {
            ...commonOptions,
            plugins: {
                ...commonOptions.plugins,
                title: { display: false },
                tooltip: { ...commonOptions.plugins.tooltip, ...precipTooltip }
            },
            scales: {
                x: commonOptions.scales.x,
                y: { ...commonOptions.scales.y, min: 0 }
            }
        },
        plugins: plugins
    }));

    // --- Chart 4: Wind ---
    const ctxWind = document.getElementById('windChart').getContext('2d');
    charts.push(new Chart(ctxWind, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Wind Speed (mph)',
                    data: hourly.wind_speed_10m,
                    borderColor: '#1565c0',
                    backgroundColor: 'rgba(21, 101, 192, 0.2)',
                    fill: true,
                    tension: 0.2
                }
            ]
        },
        options: {
            ...commonOptions,
            scales: {
                x: commonOptions.scales.x,
                y: { ...commonOptions.scales.y, min: 0, title: { display: true, text: 'mph' } }
            }
        },
        plugins: plugins
    }));
}
