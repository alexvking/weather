
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { geoCode, getWeather } from '../api.js';

describe('API Client', () => {
    beforeEach(() => {
        global.fetch = vi.fn();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('geoCode returns location data', async () => {
        const mockResponse = { results: [{ name: 'Seattle', latitude: 47.6, longitude: -122.3 }] };
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockResponse
        });

        const result = await geoCode('Seattle');
        expect(result.name).toBe('Seattle');
        expect(fetch).toHaveBeenCalledWith(expect.stringContaining('geocoding-api.open-meteo.com'));
    });

    it('getWeather returns weather data', async () => {
        const mockResponse = { hourly: {}, daily: {} };
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockResponse
        });

        const result = await getWeather(47.6, -122.3);
        expect(result).toEqual(mockResponse);
        expect(fetch).toHaveBeenCalledWith(expect.stringContaining('api.open-meteo.com'));
    });
});
