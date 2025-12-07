import React, { useState } from "react";
import { sendSMS } from "../services/smsService";

const SMSConfirmation = ({
  phoneNumber,
  message,
  customerName,
  onConfirm,
  onCancel,
}) => {
  const [editedMessage, setEditedMessage] = useState(message);
  const [editedPhone, setEditedPhone] = useState(phoneNumber);
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    setSending(true);
    try {
      const result = await sendSMS(editedPhone, editedMessage);
      if (onConfirm) {
        onConfirm(result);
      }
    } catch (error) {
      if (onConfirm) {
        onConfirm({ success: false, message: "حدث خطأ أثناء الإرسال" });
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "600px" }}
      >
        <div className="modal-header">
          <h3 className="modal-title">📱 إرسال رسالة SMS</h3>
          <button className="modal-close" onClick={onCancel}>
            ×
          </button>
        </div>

        <div style={{ marginBottom: "var(--spacing-lg)" }}>
          <div className="alert alert-info">
            <strong>📤 هل تريد إرسال رسالة SMS إلى {customerName}؟</strong>
            <p
              style={{
                marginTop: "var(--spacing-sm)",
                marginBottom: 0,
                fontSize: "0.875rem",
              }}
            >
              يمكنك تعديل الرسالة أو رقم الهاتف قبل الإرسال
            </p>
          </div>

          <div className="form-group">
            <label className="form-label">رقم الهاتف</label>
            <input
              type="tel"
              className="form-input"
              value={editedPhone}
              onChange={(e) => setEditedPhone(e.target.value)}
              placeholder="970594659371"
            />
          </div>

          <div className="form-group">
            <label className="form-label">نص الرسالة</label>
            <textarea
              className="form-textarea"
              value={editedMessage}
              onChange={(e) => setEditedMessage(e.target.value)}
              rows="8"
              style={{
                minHeight: "150px",
                fontFamily: "inherit",
                fontSize: "0.95rem",
                lineHeight: "1.6",
              }}
            />
            <small
              className="text-muted"
              style={{ display: "block", marginTop: "var(--spacing-sm)" }}
            >
              عدد الأحرف: {editedMessage.length}
            </small>
          </div>
        </div>

        <div className="flex gap-md">
          <button
            className="btn btn-success"
            onClick={handleSend}
            disabled={sending || !editedPhone || !editedMessage}
            style={{ flex: 1 }}
          >
            {sending ? "⏳ جاري الإرسال..." : "✓ إرسال الرسالة"}
          </button>
          <button
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={sending}
            style={{ flex: 1 }}
          >
            ✗ إلغاء
          </button>
        </div>
      </div>
    </div>
  );
};

export default SMSConfirmation;
