import { useEffect, useState } from "react";
import "./ap.css";

const API_KEY = "26ff6210812d4629afc181140261803";
const API_BASE_URL = "https://api.weatherapi.com/v1/current.json";
const RECENT_CITIES_KEY = "weather_recent_cities";

function toFahrenheit(tempCelsius) {
  return (tempCelsius * 9) / 5 + 32;
}

function App() {
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [country, setCountry] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");
  const [temperature, setTemperature] = useState(null);
  const [condition, setCondition] = useState("");
  const [iconCode, setIconCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [unit, setUnit] = useState("C");
  const [error, setError] = useState("");
  const [recentCities, setRecentCities] = useState([]);

  useEffect(() => {
    const savedCities = localStorage.getItem(RECENT_CITIES_KEY);
    if (!savedCities) {
      return;
    }

    try {
      const parsedCities = JSON.parse(savedCities);
      if (Array.isArray(parsedCities)) {
        setRecentCities(parsedCities);
      }
    } catch {
      localStorage.removeItem(RECENT_CITIES_KEY);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(RECENT_CITIES_KEY, JSON.stringify(recentCities));
  }, [recentCities]);

  async function fetchWeather(cityName) {
    if (!cityName.trim()) {
      setError("Please enter a city name.");
      return;
    }

    if (!API_KEY || API_KEY === "PASTE_YOUR_WEATHERAPI_KEY_HERE") {
      setError("Add your WeatherAPI key in app.jsx before searching.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}?key=${API_KEY}&q=${encodeURIComponent(cityName)}&aqi=no`
      );

      const data = await response.json();

      if (!response.ok) {
        const apiErrorMessage = data?.error?.message || "";

        if (response.status === 401) {
          throw new Error("Invalid WeatherAPI key (401). Please check your key.");
        }

        if (response.status === 404) {
          throw new Error("City not found. Please try a different city.");
        }

        if (response.status === 429) {
          throw new Error("Rate limit exceeded. Please wait and try again.");
        }

        if (apiErrorMessage) {
          throw new Error(`API error: ${apiErrorMessage}`);
        }

        throw new Error("Could not fetch weather right now. Please try again.");
      }

      setCity(data.location.name);
      setRegion(data.location.region || "");
      setCountry(data.location.country || "");
      setLastUpdated(data.current.last_updated || "");
      setTemperature(data.current.temp_c);
      setCondition(data.current.condition.text);
      setIconCode(data.current.condition.icon.startsWith("//")
        ? `https:${data.current.condition.icon}`
        : data.current.condition.icon);

      setRecentCities((currentCities) => {
        const uniqueCities = [
          data.location.name,
          ...currentCities.filter((item) => item !== data.location.name),
        ];
        return uniqueCities.slice(0, 6);
      });
    } catch (err) {
      setCity("");
      setRegion("");
      setCountry("");
      setLastUpdated("");
      setTemperature(null);
      setCondition("");
      setIconCode("");
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    fetchWeather(query);
  }

  function formatTemperature(valueInCelsius) {
    if (valueInCelsius === null) {
      return "--";
    }

    if (unit === "C") {
      return `${Math.round(valueInCelsius)}°C`;
    }

    return `${Math.round(toFahrenheit(valueInCelsius))}°F`;
  }

  return (
    <main className="weather-app">
      <section className="weather-panel">
        <p className="eyebrow">Simple Weather Checker</p>
        <h1>Check weather in any city</h1>
        <p className="helper-text">
          Type a city name, press search, and quickly see temperature and weather condition.
        </p>

        <form className="search-form" onSubmit={handleSubmit}>
          <label htmlFor="city-input">City name</label>
          <div className="search-row">
            <input
              id="city-input"
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Example: London"
            />
            <button type="submit" disabled={loading}>
              {loading ? "Searching..." : "Search"}
            </button>
          </div>
        </form>

        <div className="unit-toggle" role="group" aria-label="Temperature unit">
          <button
            type="button"
            className={unit === "C" ? "is-active" : ""}
            onClick={() => setUnit("C")}
          >
            °C
          </button>
          <button
            type="button"
            className={unit === "F" ? "is-active" : ""}
            onClick={() => setUnit("F")}
          >
            °F
          </button>
        </div>

        {loading && <p className="status loading">Loading weather data...</p>}
        {!loading && error && <p className="status error">{error}</p>}

        {!loading && !error && temperature !== null && (
          <article className="weather-card" aria-live="polite">
            <header>
              <p className="city-name">{city}</p>
              <p className="temperature">{formatTemperature(temperature)}</p>
            </header>
            {(region || country) && (
              <p className="location-meta">
                Matched location: {[region, country].filter(Boolean).join(", ")}
              </p>
            )}
            {lastUpdated && (
              <p className="location-meta">Last updated: {lastUpdated}</p>
            )}

            <div className="condition-row">
              {iconCode && (
                <img
                  src={iconCode}
                  alt={condition}
                  width="80"
                  height="80"
                />
              )}
              <p className="condition">{condition}</p>
            </div>
          </article>
        )}

        {recentCities.length > 0 && (
          <section className="recent-cities" aria-label="Last searched cities">
            <h2>Last searched cities</h2>
            <div className="city-chips">
              {recentCities.map((recentCity) => (
                <button
                  key={recentCity}
                  type="button"
                  className="chip"
                  onClick={() => {
                    setQuery(recentCity);
                    fetchWeather(recentCity);
                  }}
                >
                  {recentCity}
                </button>
              ))}
            </div>
          </section>
        )}

        <p className="note">
          Tip: try searching with country for exact results, for example: Delhi, India.
        </p>
      </section>
    </main>
  );
}

export default App;
