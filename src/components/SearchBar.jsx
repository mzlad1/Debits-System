import React from 'react'
import { useState } from 'react';

const SearchBar = ({ onSearch, placeholder = 'ابحث...' }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearch(value);
  };

  return (
    <div className="search-bar">
      <input
        type="text"
        className="search-input"
        value={searchTerm}
        onChange={handleChange}
        placeholder={placeholder}
      />
    </div>
  );
};

export default SearchBar;
