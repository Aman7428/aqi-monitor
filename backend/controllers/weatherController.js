import axios from "axios";
import SensorData from "../models/SensorData.js";
import { calculateAQI } from "../utils/aqiCalculator.js";

// GET /api/weather or /api/aqi/current
export const getWeatherData = async (req, res) => {
  try {
    const apiKey = process.env.OPENWEATHERMAP_API_KEY;
    if (!apiKey) throw new Error("OpenWeatherMap API key missing");

    // most recent saved snapshot (for reference, not Arduino)
    const lastSnapshot =
      (await SensorData.findOne().sort({ createdAt: -1 }).lean()) || {};

    const cityName = process.env.CITY_NAME || "Delhi,IN";
    const lat = parseFloat(process.env.CITY_LAT || "28.7041");
    const lon = parseFloat(process.env.CITY_LON || "77.1025");

    const [airPollution, weather] = await Promise.all([
      axios.get("https://api.openweathermap.org/data/2.5/air_pollution", {
        params: { lat, lon, appid: apiKey },
      }),
      axios.get("https://api.openweathermap.org/data/2.5/weather", {
        params: { q: cityName, appid: apiKey, units: "metric" },
      }),
    ]);

    // pollutants from OpenWeatherMap air‑pollution API
    const comps = airPollution.data.list[0].components || {};
    const apiPollutants = {
      pm25: comps.pm2_5 || 0,
      pm10: comps.pm10 || 0,
      o3: comps.o3 || 0,
      co: (comps.co || 0) / 1000, // μg/m³ → approx ppm
      so2: comps.so2 || 0,
      no2: comps.no2 || 0,
      nh3: comps.nh3 || 0,
    };

    // AQI from own calculator
    const calculatedAQI = calculateAQI(apiPollutants);

    // OpenWeather AQI (1–5) mapped to US‑style 0–500
    const owAQI = airPollution.data.list[0].main.aqi;
    const mappedOWAQI =
      {
        1: 25, // good
        2: 75,
        3: 125,
        4: 175,
        5: 300,
      }[owAQI] || 0;

    let finalAQI = calculatedAQI;
    if (Math.abs(calculatedAQI - mappedOWAQI) > 50) {
      finalAQI = mappedOWAQI;
    }

    const temperature = weather.data.main?.temp ?? 0;
    const humidity = weather.data.main?.humidity ?? 0;

    // save snapshot for history + alerts
    const snapshot = new SensorData({
      aqi: finalAQI,
      pm25: apiPollutants.pm25,
      pm10: apiPollutants.pm10,
      o3: apiPollutants.o3,
      so2: apiPollutants.so2,
      no2: apiPollutants.no2,
      nh3: apiPollutants.nh3,
      co: apiPollutants.co,
      temperature,
      humidity,
    });
    await snapshot.save();

    const responseData = {
      aqi: finalAQI,
      pm25: apiPollutants.pm25,
      pm10: apiPollutants.pm10,
      o3: apiPollutants.o3,
      so2: apiPollutants.so2,
      no2: apiPollutants.no2,
      nh3: apiPollutants.nh3,
      co: apiPollutants.co,
      temperature,
      humidity,
      lastSnapshot, // optional: previous saved data
    };

    res.json(responseData);
  } catch (error) {
    console.error("Weather Data Error:", error.message);
    res
      .status(500)
      .json({ error: "Failed to fetch weather data", details: error.message });
  }
};

// GET /api/aqi/history
export const getHistoricalData = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const data = await SensorData.find({ createdAt: { $gte: thirtyDaysAgo } })
      .sort({ createdAt: 1 })
      .lean();

    if (!data || data.length === 0) return res.json([]);

    const groupedByDay = {};
    data.forEach((entry) => {
      const date = new Date(entry.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      if (!groupedByDay[date]) {
        groupedByDay[date] = { count: 1, totalAqi: entry.aqi || 0 };
      } else {
        groupedByDay[date].count++;
        groupedByDay[date].totalAqi += entry.aqi || 0;
      }
    });

    const formattedData = Object.keys(groupedByDay).map((date) => ({
      date,
      aqi: Math.round(
        groupedByDay[date].totalAqi / groupedByDay[date].count
      ),
    }));

    res.json(formattedData);
  } catch (error) {
    console.error("Historical Data Error:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch historical data", details: error.message });
  }
};
