import React, { useState, useEffect } from 'react';

const RegionFilter = ({ filters, setFilters }) => {
  const [districts, setDistricts] = useState([]);

  const districtList = {
    maharashtra: ["Mumbai City", "Pune", "Nagpur", "Thane", "Nashik"],
    uttar_pradesh: ["Lucknow", "Kanpur", "Varanasi", "Agra", "Ghaziabad"],
    tamil_nadu: ["Chennai", "Coimbatore", "Madurai", "Salem", "Trichy"],
    karnataka: ["Bengaluru Urban", "Mysuru", "Hubli-Dharwad", "Mangaluru", "Belagavi"]
  };

  const handleStateChange = (e) => {
    const state = e.target.value;
    if (state === 'all') {
      setDistricts([]);
      setFilters(prev => ({ ...prev, state: 'all', district: 'all' }));
    } else {
      setDistricts(districtList[state] || []);
      setFilters(prev => ({ ...prev, state: state, district: 'all' }));
    }
  };

  const handleDistrictChange = (e) => {
    setFilters(prev => ({ ...prev, district: e.target.value }));
  };

  const handleTimeChange = (e) => {
    setFilters(prev => ({ ...prev, time: e.target.value }));
  };

  return (
    <section className="filter-panel" id="global-filter-panel">
      <div className="filter-group">
        <label htmlFor="filter-state">State / Region</label>
        <select 
          className="filter-select" 
          id="filter-state"
          value={filters.state}
          onChange={handleStateChange}
        >
          <option value="all">National Aggregation</option>
          <option value="maharashtra">Maharashtra (MH)</option>
          <option value="uttar_pradesh">Uttar Pradesh (UP)</option>
          <option value="tamil_nadu">Tamil Nadu (TN)</option>
          <option value="karnataka">Karnataka (KA)</option>
        </select>
      </div>

      <div className="filter-group">
        <label htmlFor="filter-district">District</label>
        <select 
          className="filter-select" 
          id="filter-district"
          value={filters.district}
          onChange={handleDistrictChange}
          disabled={filters.state === 'all'}
        >
          <option value="all">All Districts</option>
          {districts.map(dist => (
            <option key={dist} value={dist.toLowerCase().replace(" ", "_")}>
              {dist}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label htmlFor="filter-time">Time Window</label>
        <select 
          className="filter-select" 
          id="filter-time"
          value={filters.time}
          onChange={handleTimeChange}
        >
          <option value="12m">Past 12 Months</option>
          <option value="6m">Past 6 Months</option>
          <option value="3y">Past 3 Years</option>
        </select>
      </div>
    </section>
  );
};

export default RegionFilter;
