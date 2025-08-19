import { useState } from 'react';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import './App.css';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Polyline } from 'react-leaflet';


interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
}

interface Flight {
  airline: string;
  from: string;
  to: string;
  price: number;
  duration: string;
}

const FlyTo = ({ position }: { position: LatLngExpression | null }) => {
  const map = useMap();
  if (position) map.flyTo(position, 5, { duration: 1.5 });
  return null;
};
const getCurvePoints = (from: LatLngExpression, to: LatLngExpression, curvature = 0.2) => {
  const [lat1, lon1] = from as [number, number];
  const [lat2, lon2] = to as [number, number];

  // Midpoint
  const mx = (lat1 + lat2) / 2;
  const my = (lon1 + lon2) / 2;

  // Offset for curvature
  const dx = lat2 - lat1;
  const dy = lon2 - lon1;
  const qx = mx - dy * curvature;
  const qy = my + dx * curvature;

  // Return a simple 3-point curve: from -> control -> to
  return [
    [lat1, lon1],
    [qx, qy],
    [lat2, lon2],
  ];
};
function App() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [fromResults, setFromResults] = useState<SearchResult[]>([]);
  const [toResults, setToResults] = useState<SearchResult[]>([]);
  const [fromSelected, setFromSelected] = useState<SearchResult | null>(null);
  const [toSelected, setToSelected] = useState<SearchResult | null>(null);
  const [flights, setFlights] = useState<Flight[]>([]);
  const [priceFilter, setPriceFilter] = useState<number | ''>('');
  const [showDropdown, setShowDropdown] = useState<'from' | 'to' | null>(null);

  const searchCity = async (query: string, type: 'from' | 'to') => {
    if (!query) return;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5`
      );
      const data: SearchResult[] = await res.json();
      type === 'from' ? setFromResults(data) : setToResults(data);
      setShowDropdown(type);
    } catch (err) {
      console.error('Geocoding error:', err);
    }
  };

  const selectCity = (city: SearchResult, type: 'from' | 'to') => {
    if (type === 'from') {
      setFromSelected(city);
      setFrom(city.display_name);
    } else {
      setToSelected(city);
      setTo(city.display_name);
    }
    setShowDropdown(null);
  };

  const generateFlights = () => {
    if (!from || !to) return;
    const dummyAirlines = ['Delta', 'United', 'American Airlines', 'Southwest', 'JetBlue'];
    const generatedFlights: Flight[] = Array.from({ length: 5 }, (_, i) => ({
      airline: dummyAirlines[i % dummyAirlines.length],
      from,
      to,
      price: Math.floor(Math.random() * 400) + 100,
      duration: `${Math.floor(Math.random() * 5) + 2}h ${Math.floor(Math.random() * 60)}m`,
    }));
    if (priceFilter !== '') {
      setFlights(generatedFlights.filter(f => f.price <= Number(priceFilter)));
    } else {
      setFlights(generatedFlights);
    }
  };

  return (
    <div className='mainDashboard'>
      <header className="header">
        <div className="logos">
          <a href="https://vite.dev" target="_blank"><img src={viteLogo} alt="Vite" /></a>
          <a href="https://react.dev" target="_blank"><img src={reactLogo} alt="React" /></a>
        </div>
        <h1>✈️ AirTrip Explorer Dashboard</h1>
      </header>

      <div className="controls">
        <div style={{ position: 'relative', flex: 1, marginRight: '10px' }}>
          <input
            type="text"
            placeholder="From..."
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
          <button onClick={() => searchCity(from, 'from')}>Search</button>
          {showDropdown === 'from' && fromResults.length > 0 && (
            <div className="dropdown" style={{
              position: 'absolute', top: '40px', left: 0, right: 0,
              maxHeight: '150px', overflowY: 'auto', background: '#fff', border: '1px solid #ccc', zIndex: 999
            }}>
              {fromResults.map((r, idx) => (
                <div key={idx} className="city-card" onClick={() => selectCity(r, 'from')}>
                  {r.display_name}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ position: 'relative', flex: 1, marginRight: '10px' }}>
          <input
            type="text"
            placeholder="To..."
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
          <button onClick={() => searchCity(to, 'to')}>Search</button>
          {showDropdown === 'to' && toResults.length > 0 && (
            <div className="dropdown" style={{
              position: 'absolute', top: '40px', left: 0, right: 0,
              maxHeight: '150px', overflowY: 'auto', background: '#fff', border: '1px solid #ccc', zIndex: 999
            }}>
              {toResults.map((r, idx) => (
                <div key={idx} className="city-card" onClick={() => selectCity(r, 'to')}>
                  {r.display_name}
                </div>
              ))}
            </div>
          )}
        </div>

        <input
          type="number"
          placeholder="Max Price"
          value={priceFilter}
          onChange={(e) => {
            const val = e.target.value;
            setPriceFilter(val === '' ? '' : Number(val));
          }}
          style={{ width: '120px', marginRight: '10px' }}
        />
        <button onClick={generateFlights}>Search Flights ✈️</button>
      </div>

      <div className="main">
        <div className="map-container">
          <MapContainer center={[39.8283, -98.5795]} zoom={4} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />
            {fromSelected && <Marker position={[parseFloat(fromSelected.lat), parseFloat(fromSelected.lon)]}>
              <Popup>From: {fromSelected.display_name}</Popup>
            </Marker>}
            {toSelected && <Marker position={[parseFloat(toSelected.lat), parseFloat(toSelected.lon)]}>
              <Popup>To: {toSelected.display_name}</Popup>
            </Marker>}
            {fromSelected && <FlyTo position={[parseFloat(fromSelected.lat), parseFloat(fromSelected.lon)]} />}
                  {fromSelected && toSelected && (
  <Polyline
    positions={getCurvePoints(
      [parseFloat(fromSelected.lat), parseFloat(fromSelected.lon)],
      [parseFloat(toSelected.lat), parseFloat(toSelected.lon)]
    ) as LatLngExpression[]}
    color="blue"
    weight={3}
    dashArray="5, 10"
  />
)}
          </MapContainer>
        </div>

        <div className="sidebar">
          <h2>Flight Results</h2>
          {flights.length === 0 && <p>No flights found</p>}
          {flights.map((f, idx) => (
            <div key={idx} className="flight-card" style={{
              display: 'flex', flexDirection: 'column', padding: '10px', marginBottom: '10px',
              border: '1px solid #ccc', borderRadius: '8px', background: '#f9f9f9'
            }}>
              <div style={{ fontWeight: 'bold', fontSize: '16px' }}>✈️ {f.airline}</div>
              <div>📍 {f.from} → {f.to}</div>
              <div>💲 Price: ${f.price}</div>
              <div>⏱ Duration: {f.duration}</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

export default App;
