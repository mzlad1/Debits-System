
import React from 'react'
import { useState, useEffect } from 'react';
import { searchCustomers } from '../services/customerService';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import SearchBar from '../components/SearchBar';
import CustomerCard from '../components/CustomerCard';
import AddCustomer from '../components/AddCustomer';
import AddTransaction from '../components/AddTransaction';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  
  const { user } = useAuth();

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const data = await searchCustomers(user.uid, '');
      setCustomers(data);
      setFilteredCustomers(data);
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (searchTerm) => {
    try {
      const data = await searchCustomers(user.uid, searchTerm);
      setFilteredCustomers(data);
    } catch (error) {
      console.error('Error searching customers:', error);
    }
  };

  const handleCustomerAdded = () => {
    loadCustomers();
    setShowAddCustomer(false);
  };

  const handleTransactionAdded = () => {
    // Reload customers to update balances
    loadCustomers();
    setShowAddTransaction(false);
    setSelectedCustomer(null);
  };

  const handleTransactionClick = (customer) => {
    setSelectedCustomer(customer);
    setShowAddTransaction(true);
  };

  return (
    <Layout>
      <div className="container">
        <div className="flex justify-between items-center mb-xl">
          <h1>إدارة الزبائن</h1>
          <div className="flex gap-md">
            <button 
              className="btn btn-primary"
              onClick={() => setShowAddCustomer(true)}
            >
              + إضافة زبون
            </button>
            <button 
              className="btn btn-success"
              onClick={() => setShowAddTransaction(true)}
            >
              + إضافة معاملة
            </button>
          </div>
        </div>

        <SearchBar 
          onSearch={handleSearch}
          placeholder="ابحث عن زبون بالاسم..."
        />

        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="card text-center" style={{ padding: '3rem' }}>
            <h3 className="text-muted">لا يوجد زبائن</h3>
            <p className="text-muted">ابدأ بإضافة زبون جديد</p>
            <button 
              className="btn btn-primary"
              onClick={() => setShowAddCustomer(true)}
              style={{ marginTop: '1rem' }}
            >
              + إضافة زبون
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-lg">
            {filteredCustomers.map(customer => (
              <CustomerCard 
                key={customer.id} 
                customer={customer}
                onTransactionClick={handleTransactionClick}
                onCustomerUpdated={loadCustomers}
              />
            ))}
          </div>
        )}

        {showAddCustomer && (
          <AddCustomer 
            onCustomerAdded={handleCustomerAdded}
            onClose={() => setShowAddCustomer(false)}
          />
        )}

        {showAddTransaction && (
          <AddTransaction 
            customers={customers}
            selectedCustomer={selectedCustomer}
            onTransactionAdded={handleTransactionAdded}
            onClose={() => {
              setShowAddTransaction(false);
              setSelectedCustomer(null);
            }}
          />
        )}
      </div>
    </Layout>
  );
};

export default Customers;
