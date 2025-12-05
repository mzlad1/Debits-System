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
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc'
  
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

  // Transaction edit/delete states
  const [transactionToDelete, setTransactionToDelete] = useState(null);
  const [transactionToEdit, setTransactionToEdit] = useState(null);
  const [editTransAmount, setEditTransAmount] = useState('');
  const [editTransDescription, setEditTransDescription] = useState('');

  const handleDeleteTransaction = (transaction) => {
    setTransactionToDelete(transaction);
  };

  const confirmDeleteTransaction = async () => {
    try {
      setLoading(true);
      const { deleteTransaction } = await import('../services/transactionService');
      await deleteTransaction(transactionToDelete.id);
      await loadTransactions();
      setTransactionToDelete(null);
    } catch (error) {
      console.error('Error deleting transaction:', error);
      alert('حدث خطأ أثناء حذف المعاملة');
    } finally {
      setLoading(false);
    }
  };

  const handleEditTransaction = (transaction) => {
    setTransactionToEdit(transaction);
    setEditTransAmount(transaction.amount.toString());
    setEditTransDescription(transaction.description || '');
  };

  const saveEditTransaction = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { updateTransaction } = await import('../services/transactionService');
      const updateData = { amount: parseFloat(editTransAmount) };
      if (transactionToEdit.type === 'debt') {
        updateData.description = editTransDescription;
      }
      await updateTransaction(transactionToEdit.id, updateData);
      await loadTransactions();
      setTransactionToEdit(null);
    } catch (error) {
      console.error('Error updating transaction:', error);
      alert('حدث خطأ أثناء تحديث المعاملة');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    let hours = date.getHours();
    const minutes = date.getMinutes();
    
    const ampm = hours >= 12 ? 'مساءً' : 'صباحاً';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 should be 12
    
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    
    return `التاريخ: ${day}/${month}/${year} والساعة ${hours}:${formattedMinutes} ${ampm}`;
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

  const getSortedTransactions = () => {
    return [...transactions].sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
      
      if (sortOrder === 'asc') {
        return dateA - dateB;
      } else {
        return dateB - dateA;
      }
    });
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                  <h4 style={{ margin: 0 }}>سجل المعاملات</h4>
                  <button
                    className="btn btn-secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
                    }}
                    style={{ 
                      fontSize: '0.875rem', 
                      padding: 'var(--spacing-xs) var(--spacing-sm)',
                      minWidth: 'auto'
                    }}
                    title={sortOrder === 'desc' ? 'الأحدث أولاً' : 'الأقدم أولاً'}
                  >
                    {sortOrder === 'desc' ? '↓ الأحدث' : '↑ الأقدم'}
                  </button>
                </div>
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
                  {getSortedTransactions().map(transaction => (
                    <div key={transaction.id} className="transaction-item">
                      <div className="transaction-info" style={{ flex: 1 }}>
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                        <div className={`transaction-amount ${
                          transaction.type === 'payment' ? 'text-success' : 
                          transaction.transactionType === 'cash' ? 'text-success' : 'text-danger'
                        }`}>
                          {transaction.type === 'debt' 
                            ? (transaction.transactionType === 'cash' ? '' : '-')
                            : '+'
                          } {formatCurrency(transaction.amount)}
                        </div>
                        <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
                          <button
                            className="btn btn-secondary"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditTransaction(transaction);
                            }}
                            style={{ 
                              fontSize: '0.75rem', 
                              padding: 'var(--spacing-xs) var(--spacing-sm)',
                              minWidth: 'auto'
                            }}
                          >
                            ✏️
                          </button>
                          <button
                            className="btn btn-danger"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTransaction(transaction);
                            }}
                            style={{ 
                              fontSize: '0.75rem', 
                              padding: 'var(--spacing-xs) var(--spacing-sm)',
                              minWidth: 'auto'
                            }}
                          >
                            🗑️
                          </button>
                        </div>
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

      {/* Delete Transaction Confirmation Modal */}
      {transactionToDelete && (
        <div className="modal-overlay" onClick={() => setTransactionToDelete(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 className="modal-title">تأكيد الحذف</h3>
              <button className="modal-close" onClick={() => setTransactionToDelete(null)}>×</button>
            </div>
            <div style={{ padding: 'var(--spacing-md) 0' }}>
              <p>هل أنت متأكد من حذف هذه المعاملة؟</p>
              <div className="alert alert-error" style={{ marginTop: 'var(--spacing-md)' }}>
                ⚠️ لا يمكن التراجع عن هذا الإجراء
              </div>
            </div>
            <div className="flex gap-md">
              <button 
                className="btn btn-danger"
                onClick={confirmDeleteTransaction}
                disabled={loading}
                style={{ flex: 1 }}
              >
                {loading ? 'جاري الحذف...' : 'نعم، احذف'}
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => setTransactionToDelete(null)}
                disabled={loading}
                style={{ flex: 1 }}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Transaction Modal */}
      {transactionToEdit && (
        <div className="modal-overlay" onClick={() => setTransactionToEdit(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">تعديل المعاملة</h3>
              <button className="modal-close" onClick={() => setTransactionToEdit(null)}>×</button>
            </div>
            <form onSubmit={saveEditTransaction}>
              {transactionToEdit.type === 'debt' && (
                <div className="form-group">
                  <label className="form-label">التفصيل</label>
                  <textarea
                    className="form-textarea"
                    value={editTransDescription}
                    onChange={(e) => setEditTransDescription(e.target.value)}
                    required
                    style={{ minHeight: '80px' }}
                  />
                </div>
              )}
              <div className="form-group">
                <label className="form-label">المبلغ *</label>
                <input
                  type="number"
                  className="form-input"
                  value={editTransAmount}
                  onChange={(e) => setEditTransAmount(e.target.value)}
                  required
                  min="0"
                  step="0.01"
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
                  onClick={() => setTransactionToEdit(null)}
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
