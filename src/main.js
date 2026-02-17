
import './style.css';
import { geoCode, getWeather } from './api.js';
import { renderHeader, renderDailyForecast, renderCharts } from './ui.js';
import { initViewportPreview } from './viewport-preview.js';

// Performance profiling
performance.mark('page-start');

// Feature Flag: Ultra-Dense Mobile View
const USE_ULTRA_DENSE = true;
if (USE_ULTRA_DENSE) {
  document.body.classList.add('ultra-dense');
}

// Hide skeleton and show content
function hideLoadingSkeletons() {
  const skeletons = document.querySelectorAll('.loading-skeleton');
  skeletons.forEach(skeleton => {
    skeleton.classList.add('hidden');
  });
}

// Draw continuous time line through all charts
// Draw continuous lines (time line and crosshair) logic
// Stored chart instances to query scales
import { Chart } from 'chart.js/auto';

// Draw continuous time line through all charts at current time
function updateContinuousLines(hourlyData, utcOffsetSeconds) {
  const chartsWrapper = document.getElementById('charts-wrapper');
  const firstChartCanvas = document.getElementById('tempChart');
  const timeLine = document.getElementById('current-time-line');
  const crosshairLine = document.getElementById('crosshair-line');

  if (!firstChartCanvas || !chartsWrapper || !timeLine) return;

  // Get the chart instance
  const chart = Chart.getChart(firstChartCanvas);
  if (!chart) return;

  // 1. Position Black Time Line
  // Find index of "now" relative to the chart's first data point
  // We know the chart starts at local midnight today in target TZ.
  const nowMs = Date.now();
  const localNow = new Date(nowMs + (utcOffsetSeconds * 1000));
  const hourIndex = localNow.getUTCHours(); // Since index 0 is 00:00

  const xScale = chart.scales.x;
  const x = xScale.getPixelForValue(hourIndex);

  // Position relative to the wrapper
  // Chart canvas has some padding, but getPixelForValue returns relative to canvas
  // Canvas is inside chart-container. 
  // We need to account for the chart area within the canvas.
  // Actually, usually getPixelForValue gives coordinates relative to canvas. 
  // The canvas fills .chart-container. .chart-container has no padding?
  // Let's assume 0,0 of canvas is 0,0 of container.
  // However, the wrapper is the parent of containers. 
  // And charts have left padding (y-axis).

  // We don't need manual offset anymore if we use the scale pixel!
  // But we need to make sure the continuous line is positioned ABSOLUTELY within the wrapper.
  // The wrapper has position: relative? (Check CSS)
  // If wrapper is relative, and chart-container is just a div...
  // The X pixel from chart chart.scales.x.getPixelForValue(val) is relative to the CANVAS.
  // We need to add the canvas's left offset within the wrapper? 
  // Actually, all canvases are stacked vertically. Left alignment is same.
  // So x relative to canvas is x relative to wrapper (horizontally).

  if (hourIndex >= 0) {
    timeLine.style.left = `${x}px`;
    timeLine.style.top = '0';
    timeLine.style.height = '100%';
    timeLine.style.display = 'block';
  }

  // 2. Setup Crosshair Interactions
  // Remove old listeners to avoid duplicates? Function is called once per load.
  // Ideally we should adhere to setup/teardown, but replacing innerHTML of wrapper clears listeners? No.
  // We'll just add listener to wrapper.

  // Helper to get all charts
  const getAllCharts = () => {
    return [
      Chart.getChart(document.getElementById('tempChart')),
      Chart.getChart(document.getElementById('atmosphereChart')),
      Chart.getChart(document.getElementById('precipAmountChart')),
      Chart.getChart(document.getElementById('windChart'))
    ].filter(Boolean);
  };

  let rafId = null;
  chartsWrapper.onmousemove = (e) => {
    if (rafId) return;

    rafId = requestAnimationFrame(() => {
      rafId = null;
      const rect = firstChartCanvas.getBoundingClientRect();
      const xRel = e.clientX - rect.left;

      const xValue = xScale.getValueForPixel(xRel);
      const dataIndex = Math.round(xValue);

      if (dataIndex >= 0 && dataIndex < hourlyData.time.length) {
        const xSnap = xScale.getPixelForValue(dataIndex);

        // Position crosshair
        crosshairLine.style.left = `${xSnap}px`;
        crosshairLine.style.display = 'block';

        // Sync charts
        const allCharts = getAllCharts();
        allCharts.forEach(c => {
          // Check if already active to prevent redundant updates
          const active = c.getActiveElements();
          if (active.length === 0 || active[0].index !== dataIndex) {
            c.setActiveElements([{ datasetIndex: 0, index: dataIndex }]);
            c.tooltip.setActiveElements([{ datasetIndex: 0, index: dataIndex }]);
            // Use 'none' mode for fast, non-animated updates
            c.update('none');
          }
        });
      }
    });
  };

  // 3. Touch Interactions for Crosshair (No Pan)
  const handleTouch = (e) => {
    const rect = firstChartCanvas.getBoundingClientRect();
    const touch = e.touches[0];
    const xRel = touch.clientX - rect.left;

    const xValue = xScale.getValueForPixel(xRel);
    const dataIndex = Math.round(xValue);

    if (dataIndex >= 0 && dataIndex < hourlyData.time.length) {
      const xSnap = xScale.getPixelForValue(dataIndex);
      crosshairLine.style.left = `${xSnap}px`;
      crosshairLine.style.display = 'block';

      const allCharts = getAllCharts();
      allCharts.forEach(c => {
        const active = c.getActiveElements();
        if (active.length === 0 || active[0].index !== dataIndex) {
          c.setActiveElements([{ datasetIndex: 0, index: dataIndex }]);
          c.tooltip.setActiveElements([{ datasetIndex: 0, index: dataIndex }]);
          c.update('none');
        }
      });
    }
    // Prevent default to stop scrolling/panning when touching the chart
    if (e.cancelable) e.preventDefault();
  };

  chartsWrapper.ontouchstart = handleTouch;
  chartsWrapper.ontouchmove = handleTouch;
  chartsWrapper.ontouchend = () => {
    // Optionally hide or keep crosshair
  };

  chartsWrapper.onmouseleave = () => {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    crosshairLine.style.display = 'none';
    const allCharts = getAllCharts();
    allCharts.forEach(c => {
      c.setActiveElements([]);
      c.tooltip.setActiveElements([]);
      c.update('none');
    });
  };
}

async function loadWeather(query) {
  try {
    performance.mark('load-weather-start');
    console.log(`Loading weather for: ${query}`);

    performance.mark('geocode-request-start');
    const location = await geoCode(query);
    performance.mark('geocode-response-received');
    performance.measure('geocode-duration', 'geocode-request-start', 'geocode-response-received');

    console.log('Location found:', location);

    // Render basic header info immediately
    renderHeader(location);

    let weatherData;
    // TEST INJECTION: If query is "TEST_SNOW", use mock data to verify UI
    if (query === 'TEST_SNOW') {
      console.warn('USING TEST DATA FOR SNOW');
      const { mockHourlySnow, mockDaily } = await import('./test/test-data.js');
      weatherData = { hourly: mockHourlySnow, daily: mockDaily, utc_offset_seconds: -25200 }; // Mock offset for testing
    } else {
      performance.mark('weather-api-request-start');
      weatherData = await getWeather(location.latitude, location.longitude);
      performance.mark('weather-api-response-received');
      performance.measure('weather-api-duration', 'weather-api-request-start', 'weather-api-response-received');
    }

    console.log('Weather data received:', weatherData);

    performance.mark('render-start');
    renderDailyForecast({ ...weatherData.daily, utcOffsetSeconds: weatherData.utc_offset_seconds });
    renderCharts(weatherData.hourly, weatherData.utc_offset_seconds);
    performance.mark('render-complete');
    performance.measure('render-duration', 'render-start', 'render-complete');

    // Hide skeletons
    hideLoadingSkeletons();

    // Draw continuous time line and setup crosshair after charts render
    // Use requestAnimationFrame to ensure charts are fully rendered
    requestAnimationFrame(() => {
      setTimeout(() => {
        updateContinuousLines(weatherData.hourly, weatherData.utc_offset_seconds);
        // Initialize viewport preview
        initViewportPreview('forecast-container', 'viewport-handle', 'preview-sparkline', weatherData.hourly);
      }, 100);
    });

    performance.mark('load-weather-complete');
    performance.measure('total-load-time', 'load-weather-start', 'load-weather-complete');

    // Report performance metrics
    console.log('\n📊 Performance Report:');
    console.log('═'.repeat(50));

    const measures = performance.getEntriesByType('measure');
    measures.forEach(measure => {
      console.log(`${measure.name}: ${measure.duration.toFixed(2)}ms`);
    });

    const totalTime = measures.find(m => m.name === 'total-load-time');
    if (totalTime) {
      console.log('═'.repeat(50));
      console.log(`⏱️  Total Time: ${totalTime.duration.toFixed(2)}ms`);

      // Identify bottlenecks
      const weatherAPI = measures.find(m => m.name === 'weather-api-duration');
      const geocode = measures.find(m => m.name === 'geocode-duration');
      const render = measures.find(m => m.name === 'render-duration');

      console.log('\n🔍 Breakdown:');
      if (geocode) console.log(`  Geocoding: ${geocode.duration.toFixed(2)}ms (${(geocode.duration / totalTime.duration * 100).toFixed(1)}%)`);
      if (weatherAPI) console.log(`  Weather API: ${weatherAPI.duration.toFixed(2)}ms (${(weatherAPI.duration / totalTime.duration * 100).toFixed(1)}%)`);
      if (render) console.log(`  Rendering: ${render.duration.toFixed(2)}ms (${(render.duration / totalTime.duration * 100).toFixed(1)}%)`);

      console.log('\n💡 Optimization Opportunities:');
      if (weatherAPI && weatherAPI.duration > 500) {
        console.log('  • Weather API is slow (>500ms). Consider caching or parallel requests.');
      }
      if (geocode && geocode.duration > 300) {
        console.log('  • Geocoding is slow (>300ms). Consider browser geolocation or cache.');
      }
      if (render && render.duration > 200) {
        console.log('  • Chart rendering is slow (>200ms). Consider lazy loading or virtual scrolling.');
      }
      if (!weatherAPI || weatherAPI.duration < 100) {
        console.log('  ✅ API performance is excellent!');
      }
      if (!render || render.duration < 100) {
        console.log('  ✅ Render performance is excellent!');
      }
    }
    console.log('═'.repeat(50) + '\n');

  } catch (error) {
    hideLoadingSkeletons();
    alert(`Error: ${error.message}`);
    console.error(error);
  }
}

// Event Listeners
document.getElementById('search-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const query = document.getElementById('search-input').value;
  if (query) loadWeather(query);
});

// Initial Load (Default to Seattle as per mock)
performance.mark('initial-load-start');
loadWeather('Seattle');
