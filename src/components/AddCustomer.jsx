import React from "react";
import { useState } from "react";
import { addCustomer } from "../services/customerService";
import { useAuth } from "../context/AuthContext";
import { isValidPhoneNumber, formatPhoneNumber } from "../services/smsService";

const AddCustomer = ({ onCustomerAdded, onClose }) => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { user } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate phone if provided
    if (phone && !isValidPhoneNumber(phone)) {
      setError(
        "رقم الهاتف غير صحيح. يرجى إدخال رقم فلسطيني صحيح (مثال: 0599123456)"
      );
      return;
    }

    setLoading(true);

    try {
      const customerData = {
        name,
        phone: phone || "",
      };

      await addCustomer(customerData, user.uid);

      // Reset form
      setName("");
      setPhone("");

      if (onCustomerAdded) {
        onCustomerAdded();
      }

      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error("Error adding customer:", error);
      setError("حدث خطأ أثناء إضافة الزبون");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">إضافة زبون جديد</h3>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="alert alert-error">{error}</div>}

          <div className="form-group">
            <label className="form-label">اسم الزبون *</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="أدخل اسم الزبون"
            />
          </div>

          <div className="form-group">
            <label className="form-label">رقم الهاتف (لإرسال الإشعارات)</label>
            <input
              type="tel"
              className="form-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="مثال: 0599123456"
            />
            <small
              className="text-muted"
              style={{
                fontSize: "0.875rem",
                display: "block",
                marginTop: "0.5rem",
              }}
            >
              📱 سيتم إرسال رسائل SMS عند إضافة معاملات للزبون
            </small>
          </div>

          <div className="flex gap-md">
            <button
              type="submit"
              className="btn btn-primary"
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
    </div>
  );
};

export default AddCustomer;
