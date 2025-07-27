/**
 * Irrigation Service Tests
 * 
 * Tests for the new smart irrigation scheduling service.
 * Use these tests to verify that the service works correctly
 * with different inputs and edge cases.
 */

const { generateSmartSchedule } = require('../services/irrigationService');

// Mock weather data for testing
const mockWeatherData = {
  current: {
    temp: 30,
    humidity: 65,
    wind_speed: 8,
    uvi: 7,
    rain: 0
  },
  daily: [
    {
      dt: Math.floor(Date.now() / 1000),
      temp: {
        day: 30,
        min: 24,
        max: 33
      },
      humidity: 65,
      wind_speed: 8,
      rain: 0,
      uvi: 7
    },
    {
      dt: Math.floor(Date.now() / 1000) + 86400,
      temp: {
        day: 29,
        min: 23,
        max: 32
      },
      humidity: 70,
      wind_speed: 6,
      rain: 5, // Rain expected tomorrow
      uvi: 6
    }
  ]
};

// Mock the Weather model to avoid database calls
jest.mock('../models/Weather', () => ({
  findOne: jest.fn().mockImplementation(() => {
    return {
      sort: jest.fn().mockResolvedValue(null) // No weather data in DB
    };
  })
}));

// Mock axios to avoid actual API calls
jest.mock('axios', () => ({
  get: jest.fn().mockResolvedValue({
    data: {
      lat: 35.6895,
      lon: 139.6917,
      current: {
        dt: Math.floor(Date.now() / 1000),
        temp: 30,
        feels_like: 32,
        humidity: 65,
        wind_speed: 8,
        uvi: 7,
        rain: { '1h': 0 },
        weather: [{ main: 'Clear', description: 'clear sky', icon: '01d' }]
      },
      daily: [
        {
          dt: Math.floor(Date.now() / 1000),
          sunrise: Math.floor(Date.now() / 1000) - 21600,
          sunset: Math.floor(Date.now() / 1000) + 21600,
          temp: {
            day: 30,
            min: 24,
            max: 33,
            night: 25,
            eve: 28,
            morn: 26
          },
          feels_like: {
            day: 32,
            night: 25,
            eve: 30,
            morn: 26
          },
          humidity: 65,
          wind_speed: 8,
          weather: [{ main: 'Clear', description: 'clear sky', icon: '01d' }],
          rain: 0,
          uvi: 7
        },
        {
          dt: Math.floor(Date.now() / 1000) + 86400,
          sunrise: Math.floor(Date.now() / 1000) + 86400 - 21600,
          sunset: Math.floor(Date.now() / 1000) + 86400 + 21600,
          temp: {
            day: 29,
            min: 23,
            max: 32,
            night: 24,
            eve: 27,
            morn: 25
          },
          feels_like: {
            day: 31,
            night: 24,
            eve: 29,
            morn: 25
          },
          humidity: 70,
          wind_speed: 6,
          weather: [{ main: 'Rain', description: 'light rain', icon: '10d' }],
          rain: 5,
          uvi: 6
        }
      ]
    }
  })
}));

// Test cases
describe('Irrigation Service', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('generates irrigation recommendation with required params', async () => {
    const result = await generateSmartSchedule({
      location: { lat: 35.6895, lon: 139.6917 },
      cropType: 'rice',
      soilType: 'loam'
    });
    
    // Check structure
    expect(result).toHaveProperty('recommendation');
    expect(result).toHaveProperty('weather_snapshot');
    
    // Check recommendation fields
    expect(result.recommendation).toHaveProperty('date');
    expect(result.recommendation).toHaveProperty('duration_minutes');
    expect(result.recommendation).toHaveProperty('confidence_score');
    expect(result.recommendation).toHaveProperty('basis');
    
    // Check weather snapshot fields
    expect(result.weather_snapshot).toHaveProperty('rainfall_last_24h');
    expect(result.weather_snapshot).toHaveProperty('temp_max');
    expect(result.weather_snapshot).toHaveProperty('evapotranspiration');
    
    // Duration should be reasonable for rice (high water requirement)
    expect(result.recommendation.duration_minutes).toBeGreaterThan(0);
    
    // Confidence should be between 0 and 1
    expect(result.recommendation.confidence_score).toBeGreaterThan(0);
    expect(result.recommendation.confidence_score).toBeLessThanOrEqual(1);
  });
  
  test('adjusts duration based on crop type', async () => {
    // Rice needs more water than chili
    const riceResult = await generateSmartSchedule({
      location: { lat: 35.6895, lon: 139.6917 },
      cropType: 'rice',
      soilType: 'loam'
    });
    
    const chiliResult = await generateSmartSchedule({
      location: { lat: 35.6895, lon: 139.6917 },
      cropType: 'chili',
      soilType: 'loam'
    });
    
    // Rice should have longer duration than chili
    expect(riceResult.recommendation.duration_minutes).toBeGreaterThan(chiliResult.recommendation.duration_minutes);
  });
  
  test('adjusts duration based on soil type', async () => {
    // Sandy soil drains faster than clay
    const sandyResult = await generateSmartSchedule({
      location: { lat: 35.6895, lon: 139.6917 },
      cropType: 'rice',
      soilType: 'sandy'
    });
    
    const clayResult = await generateSmartSchedule({
      location: { lat: 35.6895, lon: 139.6917 },
      cropType: 'rice',
      soilType: 'clay'
    });
    
    // Sandy soil should have shorter duration but more frequent irrigation
    expect(sandyResult.recommendation.duration_minutes).toBeLessThan(clayResult.recommendation.duration_minutes);
  });
  
  test('handles rainfall correctly', async () => {
    // Mock axios to return rainy weather
    require('axios').get.mockResolvedValueOnce({
      data: {
        ...mockWeatherData,
        current: {
          ...mockWeatherData.current,
          rain: { '1h': 10 } // Heavy rain
        }
      }
    });
    
    const result = await generateSmartSchedule({
      location: { lat: 35.6895, lon: 139.6917 },
      cropType: 'rice',
      soilType: 'loam'
    });
    
    // Should recommend minimal or no irrigation during heavy rain
    expect(result.recommendation.duration_minutes).toBeLessThan(10);
  });
  
  test('applies farmer feedback', async () => {
    const regularResult = await generateSmartSchedule({
      location: { lat: 35.6895, lon: 139.6917 },
      cropType: 'rice',
      soilType: 'loam'
    });
    
    const tooMuchWaterResult = await generateSmartSchedule({
      location: { lat: 35.6895, lon: 139.6917 },
      cropType: 'rice',
      soilType: 'loam',
      feedback: { tooMuchWater: true }
    });
    
    const tooLittleWaterResult = await generateSmartSchedule({
      location: { lat: 35.6895, lon: 139.6917 },
      cropType: 'rice',
      soilType: 'loam',
      feedback: { tooLittleWater: true }
    });
    
    // Should decrease duration when too much water feedback is given
    expect(tooMuchWaterResult.recommendation.duration_minutes).toBeLessThan(regularResult.recommendation.duration_minutes);
    
    // Should increase duration when too little water feedback is given
    expect(tooLittleWaterResult.recommendation.duration_minutes).toBeGreaterThan(regularResult.recommendation.duration_minutes);
    
    // Should indicate feedback was used in the basis
    expect(tooMuchWaterResult.recommendation.basis).toContain('with_feedback');
    expect(tooLittleWaterResult.recommendation.basis).toContain('with_feedback');
  });
  
  test('handles location validation', async () => {
    await expect(generateSmartSchedule({
      cropType: 'rice',
      soilType: 'loam'
    })).rejects.toThrow('Valid location with latitude and longitude is required');
    
    await expect(generateSmartSchedule({
      location: {},
      cropType: 'rice',
      soilType: 'loam'
    })).rejects.toThrow('Valid location with latitude and longitude is required');
  });
  
  test('uses default values for missing crop and soil types', async () => {
    const result = await generateSmartSchedule({
      location: { lat: 35.6895, lon: 139.6917 }
    });
    
    // Should still generate a recommendation with default values
    expect(result).toHaveProperty('recommendation');
    expect(result).toHaveProperty('weather_snapshot');
  });
});

// If running this file directly
if (require.main === module) {
  console.log('This is a test file. Run with Jest.');
} 