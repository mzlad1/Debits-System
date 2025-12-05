import React from 'react'
import { useState, useEffect } from 'react';
import { getTransactionsByCustomer, calculateBalance, deleteTransactionsByCustomer } from '../services/transactionService';
import { deleteCustomer, updateCustomer } from '../services/customerService';
import { useAuth } from '../context/AuthContext';

const CustomerCard = ({ customer, onTransactionClick, onCustomerUpdated }) => {
  const [expanded, setExpanded] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState(customer.name);
  const [editPhone, setEditPhone] = useState(customer.phone || '');
  
  const { user } = useAuth();

  // Load transactions immediately when component mounts
  useEffect(() => {
    loadTransactions();
  }, [customer.id, user.uid]);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const data = await getTransactionsByCustomer(customer.id, user.uid);
      setTransactions(data);
      setBalance(calculateBalance(data));
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      // Delete all transactions first
      await deleteTransactionsByCustomer(customer.id, user.uid);
      // Then delete the customer
      await deleteCustomer(customer.id);
      
      // Notify parent to refresh
      if (onCustomerUpdated) {
        onCustomerUpdated();
      }
    } catch (error) {
      console.error('Error deleting customer:', error);
      alert('حدث خطأ أثناء حذف الزبون');
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await updateCustomer(customer.id, {
        name: editName,
        phone: editPhone
      });
      
      // Notify parent to refresh
      if (onCustomerUpdated) {
        onCustomerUpdated();
      }
      
      setShowEditModal(false);
    } catch (error) {
      console.error('Error updating customer:', error);
      alert('حدث خطأ أثناء تحديث الزبون');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const handleClick = () => {
    setExpanded(!expanded);
  };

  const getBalanceClass = () => {
    if (balance > 0) return 'balance-positive';
    if (balance < 0) return 'balance-negative';
    return 'balance-zero';
  };

  return (
    <>
      <div className={`card expandable-card ${expanded ? 'expanded' : ''}`}>
        <div onClick={handleClick} style={{ cursor: 'pointer' }}>
          <div className="flex justify-between items-center">
            <div>
              <h3 className="card-title" style={{ marginBottom: '0.25rem' }}>
                {customer.name}
              </h3>
              {customer.phone && (
                <p className="text-muted" style={{ fontSize: '0.875rem' }}>
                  📞 {customer.phone}
                </p>
              )}
            </div>
            <div className="text-left">
              <div className={`transaction-amount ${getBalanceClass()}`}>
                {formatCurrency(Math.abs(balance))} {balance >= 0 ? 'دين' : 'رصيد'}
              </div>
              <div className="text-muted" style={{ fontSize: '0.875rem' }}>
                {expanded ? '▲ إخفاء' : '▼ عرض التفاصيل'}
              </div>
            </div>
          </div>
        </div>

        <div className={`expandable-content ${expanded ? 'open' : ''}`}>
          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
            </div>
          ) : (
            <>
              <div style={{ marginTop: '1.5rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--spacing-md)', flexWrap: 'wrap' }}>
                <h4 style={{ margin: 0 }}>سجل المعاملات</h4>
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                  <button 
                    className="btn btn-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTransactionClick(customer);
                    }}
                    style={{ fontSize: '0.875rem', padding: 'var(--spacing-sm) var(--spacing-md)' }}
                  >
                    + معاملة
                  </button>
                  <button 
                    className="btn btn-secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowEditModal(true);
                    }}
                    style={{ fontSize: '0.875rem', padding: 'var(--spacing-sm) var(--spacing-md)' }}
                  >
                    ✏️ تعديل
                  </button>
                  <button 
                    className="btn btn-danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeleteConfirm(true);
                    }}
                    style={{ fontSize: '0.875rem', padding: 'var(--spacing-sm) var(--spacing-md)' }}
                  >
                    🗑️ حذف
                  </button>
                </div>
              </div>

              {transactions.length === 0 ? (
                <p className="text-muted text-center" style={{ padding: '2rem' }}>
                  لا توجد معاملات بعد
                </p>
              ) : (
                <div>
                  {transactions.map(transaction => (
                    <div key={transaction.id} className="transaction-item">
                      <div className="transaction-info">
                        <div className="flex items-center gap-sm" style={{ marginBottom: '0.25rem' }}>
                          {transaction.type === 'debt' ? (
                            <>
                              <span className={`badge ${transaction.transactionType === 'cash' ? 'badge-success' : 'badge-danger'}`}>
                                {transaction.transactionType === 'cash' ? 'كاش' : 'دين'}
                              </span>
                              <span className={transaction.transactionType === 'cash' ? 'text-success' : 'text-primary'}>
                                {transaction.description}
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="badge badge-success">دفعة</span>
                              <span className="text-success">دفعة مالية</span>
                            </>
                          )}
                        </div>
                        <div className="transaction-date">
                          {formatDate(transaction.createdAt)}
                        </div>
                      </div>
                      <div className={`transaction-amount ${
                        transaction.type === 'payment' ? 'text-success' : 
                        transaction.transactionType === 'cash' ? 'text-success' : 'text-danger'
                      }`}>
                        {transaction.type === 'debt' 
                          ? (transaction.transactionType === 'cash' ? '' : '-')
                          : '+'
                        } {formatCurrency(transaction.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 className="modal-title">تأكيد الحذف</h3>
              <button className="modal-close" onClick={() => setShowDeleteConfirm(false)}>×</button>
            </div>
            <div style={{ padding: 'var(--spacing-md) 0' }}>
              <p style={{ marginBottom: 'var(--spacing-md)' }}>
                هل أنت متأكد من حذف الزبون <strong>{customer.name}</strong>؟
              </p>
              <div className="alert alert-error">
                ⚠️ سيتم حذف جميع المعاملات المرتبطة بهذا الزبون ({transactions.length} معاملة)
              </div>
            </div>
            <div className="flex gap-md">
              <button 
                className="btn btn-danger"
                onClick={handleDelete}
                disabled={loading}
                style={{ flex: 1 }}
              >
                {loading ? 'جاري الحذف...' : 'نعم، احذف'}
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={loading}
                style={{ flex: 1 }}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">تعديل الزبون</h3>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>×</button>
            </div>
            <form onSubmit={handleEdit}>
              <div className="form-group">
                <label className="form-label">الاسم *</label>
                <input
                  type="text"
                  className="form-input"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">رقم الهاتف</label>
                <input
                  type="tel"
                  className="form-input"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="اختياري"
                />
              </div>
              <div className="flex gap-md">
                <button 
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                  style={{ flex: 1 }}
                >
                  {loading ? 'جاري الحفظ...' : 'حفظ'}
                </button>
                <button 
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowEditModal(false)}
                  disabled={loading}
                  style={{ flex: 1 }}
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default CustomerCard;
