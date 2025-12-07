import React from "react";
import { useState, useEffect, useRef } from "react";
import { addDebt, addPayment } from "../services/transactionService";
import { addCustomer } from "../services/customerService";
import {
  getTransactionsByCustomer,
  calculateBalance,
} from "../services/transactionService";
import { useAuth } from "../context/AuthContext";
import SMSConfirmation from "./SMSConfirmation";
import Toast from "./Toast";

const AddTransaction = ({
  customers,
  onTransactionAdded,
  onClose,
  selectedCustomer,
}) => {
  const [type, setType] = useState("debt"); // 'debt' or 'payment'
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredCustomers, setFilteredCustomers] = useState(customers);
  const [showDropdown, setShowDropdown] = useState(false);
  const [transactionType, setTransactionType] = useState("debt"); // 'debt' or 'cash' (for debts only)
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // SMS states
  const [showSMSConfirmation, setShowSMSConfirmation] = useState(false);
  const [smsData, setSmsData] = useState(null);
  const [toast, setToast] = useState(null);

  const { user } = useAuth();
  const dropdownRef = useRef(null);

  // Auto-select customer if passed as prop
  useEffect(() => {
    if (selectedCustomer) {
      setCustomerId(selectedCustomer.id);
      setCustomerName(selectedCustomer.name);
      setSearchTerm(selectedCustomer.name);
    }
  }, [selectedCustomer]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

  // Filter customers based on search
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setCustomerName(value);
    setCustomerId(""); // Clear selected customer when typing

    if (value.trim() === "") {
      setFilteredCustomers(customers);
    } else {
      const filtered = customers.filter((customer) =>
        customer.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredCustomers(filtered);
    }
    setShowDropdown(true);
  };

  const handleSelectCustomer = (customer) => {
    setCustomerId(customer.id);
    setCustomerName(customer.name);
    setSearchTerm(customer.name);
    setShowDropdown(false);
  };

  const handleAddNewCustomer = async () => {
    if (!searchTerm.trim()) return;

    try {
      setLoading(true);
      setError(""); // Clear any previous errors

      const newCustomer = await addCustomer(
        { name: searchTerm.trim() },
        user.uid
      );

      // Set the newly created customer as selected
      setCustomerId(newCustomer.id);
      setCustomerName(newCustomer.name);
      setSearchTerm(newCustomer.name);
      setShowDropdown(false);

      // Don't call onTransactionAdded here - we'll do it after transaction is saved
      // This keeps the modal open and lets user complete the transaction
    } catch (error) {
      console.error("Error adding new customer:", error);
      setError("حدث خطأ أثناء إضافة الزبون الجديد");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const generateSMSMessage = (transData) => {
    const {
      type,
      transactionType,
      amount,
      description,
      customerName,
      currentBalance,
    } = transData;

    let message;
    if (type === "debt") {
      if (transactionType === "cash") {
        message =
          `مرحبا ${customerName}،\n` +
          `تم تسجيل عملية شراء كاش بقيمة ${formatCurrency(amount)} شيكل\n` +
          `التفاصيل: ${description}\n` +
          `رصيدك الحالي: ${formatCurrency(Math.abs(currentBalance))} شيكل ${
            currentBalance >= 0 ? "دين" : "رصيد"
          }`;
      } else {
        message =
          `مرحبا ${customerName}،\n` +
          `تم تسجيل دين جديد بقيمة ${formatCurrency(amount)} شيكل\n` +
          `التفاصيل: ${description}\n` +
          `رصيدك الحالي: ${formatCurrency(Math.abs(currentBalance))} شيكل دين`;
      }
    } else {
      message =
        `مرحبا ${customerName}،\n` +
        `تم استلام دفعة بقيمة ${formatCurrency(amount)} شيكل\n` +
        `شكرا لك!\n` +
        `رصيدك الحالي: ${formatCurrency(Math.abs(currentBalance))} شيكل ${
          currentBalance >= 0 ? "دين" : "رصيد"
        }`;
    }

    return message;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!customerId && !customerName.trim()) {
      setError("يرجى اختيار أو إضافة زبون");
      return;
    }

    setLoading(true);

    try {
      // If no customer ID, create new customer first
      let finalCustomerId = customerId;
      let finalCustomerName = customerName;
      let customerPhone = null;

      if (!customerId && customerName.trim()) {
        const newCustomer = await addCustomer(
          { name: customerName.trim() },
          user.uid
        );
        finalCustomerId = newCustomer.id;
        finalCustomerName = newCustomer.name;
        customerPhone = newCustomer.phone;
      } else if (customerId) {
        // Get phone from selected customer
        const selectedCust = customers.find((c) => c.id === customerId);
        customerPhone = selectedCust?.phone;
      }

      // Save transaction WITHOUT sending SMS
      if (type === "debt") {
        await addDebt(
          {
            customerId: finalCustomerId,
            customerName: finalCustomerName,
            transactionType,
            description,
            amount,
          },
          user.uid,
          null
        ); // Pass null to skip SMS
      } else {
        await addPayment(
          {
            customerId: finalCustomerId,
            customerName: finalCustomerName,
            amount,
          },
          user.uid,
          null
        ); // Pass null to skip SMS
      }

      // Get ACTUAL balance from database after transaction
      const transactions = await getTransactionsByCustomer(
        finalCustomerId,
        user.uid
      );
      const currentBalance = calculateBalance(transactions);

      // If customer has phone, show SMS confirmation
      if (customerPhone) {
        const smsMessage = generateSMSMessage({
          type,
          transactionType,
          amount: parseFloat(amount),
          description,
          customerName: finalCustomerName,
          currentBalance,
        });

        setSmsData({
          phone: customerPhone,
          message: smsMessage,
          customerName: finalCustomerName,
        });
        setShowSMSConfirmation(true);
      } else {
        // No phone, just complete
        completeTransaction();
      }
    } catch (error) {
      console.error("Error adding transaction:", error);
      setError("حدث خطأ أثناء إضافة المعاملة");
      setLoading(false);
    }
  };

  const completeTransaction = () => {
    // Reset form
    setCustomerId("");
    setCustomerName("");
    setSearchTerm("");
    setDescription("");
    setAmount("");
    setLoading(false);

    if (onTransactionAdded) {
      onTransactionAdded();
    }

    if (onClose) {
      onClose();
    }
  };

  const handleSMSConfirm = (result) => {
    setShowSMSConfirmation(false);

    if (result.success) {
      setToast({ message: "✓ تم إرسال الرسالة بنجاح", type: "success" });
    } else {
      // Even if SMS fails, show info (not error)
      setToast({ message: "تم حفظ المعاملة (لم يتم إرسال SMS)", type: "info" });
    }

    completeTransaction();
  };

  const handleSMSCancel = () => {
    setShowSMSConfirmation(false);
    setToast({ message: "تم حفظ المعاملة بدون إرسال SMS", type: "info" });
    completeTransaction();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">
            {type === "debt" ? "إضافة دين/مشتريات" : "إضافة دفعة"}
          </h3>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="alert alert-error">{error}</div>}

          {/* Transaction Type Selector */}
          <div className="form-group">
            <label className="form-label">نوع المعاملة</label>
            <div className="flex gap-md">
              <button
                type="button"
                className={`btn ${
                  type === "debt" ? "btn-primary" : "btn-secondary"
                }`}
                onClick={() => setType("debt")}
                style={{ flex: 1 }}
              >
                دين/مشتريات
              </button>
              <button
                type="button"
                className={`btn ${
                  type === "payment" ? "btn-success" : "btn-secondary"
                }`}
                onClick={() => setType("payment")}
                style={{ flex: 1 }}
              >
                دفعة
              </button>
            </div>
          </div>

          {/* Customer Selection with Search */}
          <div className="form-group">
            <label className="form-label">الزبون *</label>
            <div style={{ position: "relative" }} ref={dropdownRef}>
              <input
                type="text"
                className="form-input"
                value={searchTerm}
                onChange={handleSearchChange}
                onFocus={() => setShowDropdown(true)}
                placeholder="ابحث عن زبون أو اكتب اسم جديد..."
                required
              />

              {showDropdown && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    maxHeight: "200px",
                    overflowY: "auto",
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-md)",
                    marginTop: "0.25rem",
                    zIndex: 1000,
                    boxShadow: "var(--shadow-lg)",
                  }}
                >
                  {filteredCustomers.length > 0 ? (
                    <>
                      {filteredCustomers.map((customer) => (
                        <div
                          key={customer.id}
                          onClick={() => handleSelectCustomer(customer)}
                          style={{
                            padding: "var(--spacing-md)",
                            cursor: "pointer",
                            borderBottom: "1px solid var(--border)",
                            transition: "background var(--transition-fast)",
                          }}
                          onMouseEnter={(e) =>
                            (e.target.style.background = "var(--bg-hover)")
                          }
                          onMouseLeave={(e) =>
                            (e.target.style.background = "transparent")
                          }
                        >
                          <div style={{ fontWeight: "500" }}>
                            {customer.name}
                          </div>
                          {customer.phone && (
                            <div
                              style={{
                                fontSize: "0.875rem",
                                color: "var(--text-muted)",
                              }}
                            >
                              📞 {customer.phone}
                            </div>
                          )}
                        </div>
                      ))}
                    </>
                  ) : searchTerm.trim() ? (
                    <div
                      style={{
                        padding: "var(--spacing-md)",
                        textAlign: "center",
                      }}
                    >
                      <p
                        className="text-muted"
                        style={{ marginBottom: "var(--spacing-sm)" }}
                      >
                        لم يتم العثور على "{searchTerm}"
                      </p>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleAddNewCustomer}
                        disabled={loading}
                        style={{ width: "100%" }}
                      >
                        + إضافة "{searchTerm}" كزبون جديد
                      </button>
                    </div>
                  ) : (
                    <div
                      style={{
                        padding: "var(--spacing-md)",
                        textAlign: "center",
                        color: "var(--text-muted)",
                      }}
                    >
                      ابدأ بالكتابة للبحث...
                    </div>
                  )}
                </div>
              )}
            </div>
            {customerId && customerName && (
              <small
                className="text-success"
                style={{
                  display: "block",
                  marginTop: "0.5rem",
                  fontWeight: "500",
                }}
              >
                ✓ تم اختيار الزبون: {customerName}
              </small>
            )}
          </div>

          {/* Debt-specific fields */}
          {type === "debt" && (
            <>
              <div className="form-group">
                <label className="form-label">نوع الدفع</label>
                <div className="flex gap-md">
                  <button
                    type="button"
                    className={`btn ${
                      transactionType === "debt"
                        ? "btn-danger"
                        : "btn-secondary"
                    }`}
                    onClick={() => setTransactionType("debt")}
                    style={{ flex: 1 }}
                  >
                    دين (على الحساب)
                  </button>
                  <button
                    type="button"
                    className={`btn ${
                      transactionType === "cash"
                        ? "btn-success"
                        : "btn-secondary"
                    }`}
                    onClick={() => setTransactionType("cash")}
                    style={{ flex: 1 }}
                  >
                    كاش
                  </button>
                </div>
                <small
                  className="text-muted"
                  style={{
                    fontSize: "0.875rem",
                    display: "block",
                    marginTop: "0.5rem",
                  }}
                >
                  {transactionType === "cash"
                    ? "الدفعات الكاش لا تُحسب في توتال الحسابات"
                    : "الديون تُضاف لحساب الزبون"}
                </small>
              </div>

              <div className="form-group">
                <label className="form-label">التفصيل *</label>
                <textarea
                  className="form-textarea"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  placeholder="ماذا اشترى الزبون؟"
                  style={{ minHeight: "80px" }}
                />
              </div>
            </>
          )}

          {/* Amount */}
          <div className="form-group">
            <label className="form-label">المبلغ *</label>
            <input
              type="number"
              className="form-input"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              min="0"
              step="0.01"
              placeholder="0.00"
            />
          </div>

          <div className="flex gap-md">
            <button
              type="submit"
              className={`btn ${
                type === "debt" ? "btn-danger" : "btn-success"
              }`}
              disabled={loading}
              style={{ flex: 1 }}
            >
              {loading ? "جاري الإضافة..." : "إضافة"}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
              style={{ flex: 1 }}
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>

      {/* SMS Confirmation Modal */}
      {showSMSConfirmation && smsData && (
        <SMSConfirmation
          phoneNumber={smsData.phone}
          message={smsData.message}
          customerName={smsData.customerName}
          onConfirm={handleSMSConfirm}
          onCancel={handleSMSCancel}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default AddTransaction;
