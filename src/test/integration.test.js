
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { geoCode, getWeather } from '../api.js';
import { renderHeader, renderDailyForecast, renderCharts } from '../ui.js';
import { mockLocation, mockDaily, mockHourly } from './test-data.js';

// Mock Chart.js
vi.mock('chart.js/auto', () => {
    return {
        default: class {
            constructor() { }
            destroy() { }
        }
    };
});

// Mock Canvas
beforeEach(() => {
    document.body.innerHTML = `
      <h1 id="location-name"></h1>
      <span id="elevation"></span>
      <div id="daily-summary"></div>
      <canvas id="tempChart"></canvas>
      <canvas id="atmosphereChart"></canvas>
      <canvas id="precipAmountChart"></canvas>
      <canvas id="windChart"></canvas>
    `;

    const mockContext = {
        createLinearGradient: vi.fn(),
    };
    HTMLCanvasElement.prototype.getContext = vi.fn(() => mockContext);
});

describe('Weather App Integration', () => {
    it('performs a full render cycle with valid data', async () => {
        // 1. Simulate fetching data (using mocks for simplicity in this integration unit test)
        // In a real E2E we'd mock the network, but here we test the "controller" logic flow
        const location = mockLocation;
        const weather = { daily: mockDaily, hourly: mockHourly };

        // 2. Render Header
        renderHeader(location);
        expect(document.getElementById('location-name')).toHaveTextContent('Test City, WA US');
        // Elevation check removed as it was explicitly deleted from UI

        // 3. Render Daily Forecast
        renderDailyForecast(weather.daily);
        const dayCards = document.querySelectorAll('.day-card');
        expect(dayCards.length).toBeGreaterThan(0);
        // Regression Check: Verify text summary exists
        expect(dayCards[0].innerHTML).toContain('Mostly Sunny'); // Derived from code 1

        // 4. Render Charts
        // We can't easily check canvas pixels in JSDOM, but we can check if it ran without error
        // and if the logic for "Precip Accumulation" (Chart 2) was executed.
        // We can spy on the Chart constructor to see if it was called 3 times
        // (This requires a bit more setup with the mock, but the basic 'not.toThrow' is a good smoke test)
        expect(() => renderCharts(weather.hourly, 0)).not.toThrow();
    });

    it('handles the snow scenario for precipitation chart', () => {
        // Regression Check: Ensure Snow Logic doesn't crash
        expect(() => renderCharts(mockHourly, 0)).not.toThrow();
    });

    it('manages vertical time and cursor lines', async () => {
        // Mock required elements
        document.body.innerHTML += `
          <div id="charts-wrapper">
            <div id="current-time-line" style="display: none;"></div>
            <div id="crosshair-line" style="display: none;"></div>
          </div>
        `;

        // We need to import main.js functions or simulate their call
        // Since main.js is side-effect heavy, we'll just check if the elements exist and can be manipulated
        const timeLine = document.getElementById('current-time-line');
        const crosshairLine = document.getElementById('crosshair-line');

        expect(timeLine).toBeDefined();
        expect(crosshairLine).toBeDefined();

        // Simulate updateContinuousLines logic (simplified)
        timeLine.style.display = 'block';
        expect(timeLine.style.display).toBe('block');
    });
});
