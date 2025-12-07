import React, { useState } from "react";
import {
  sendSMS,
  formatPhoneNumber,
  isValidPhoneNumber,
} from "../services/smsService";

const SMSTest = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleTest = async (e) => {
    e.preventDefault();

    if (!isValidPhoneNumber(phoneNumber)) {
      setResult({
        success: false,
        message: "رقم الهاتف غير صحيح. يرجى إدخال رقم فلسطيني صحيح",
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await sendSMS(phoneNumber, message);
      setResult(response);
    } catch (error) {
      setResult({
        success: false,
        message: "حدث خطأ أثناء إرسال الرسالة",
        error: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const testWithSample = () => {
    setMessage("مرحبا، هذه رسالة تجريبية من نظام إدارة الديون.");
  };

  const apiId = import.meta.env.VITE_SMS_API_ID;
  const sender = import.meta.env.VITE_SMS_SENDER;
  const enabled = import.meta.env.VITE_SMS_ENABLED === "true";

  const isConfigured =
    apiId &&
    apiId !== "your-api-id-here" &&
    sender &&
    sender !== "your-sender-name";

  return (
    <div
      className="container"
      style={{
        maxWidth: "800px",
        margin: "0 auto",
        padding: "var(--spacing-xl)",
      }}
    >
      <h2 style={{ marginBottom: "var(--spacing-lg)" }}>
        🔧 اختبار إعدادات SMS
      </h2>

      {/* Configuration Status */}
      <div className="card" style={{ marginBottom: "var(--spacing-lg)" }}>
        <h3 style={{ marginBottom: "var(--spacing-md)" }}>حالة الإعدادات</h3>

        <div style={{ display: "grid", gap: "var(--spacing-md)" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>حالة SMS:</span>
            <span
              className={enabled ? "text-success" : "text-danger"}
              style={{ fontWeight: "bold" }}
            >
              {enabled ? "✓ مفعّل" : "✗ معطّل"}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>API ID:</span>
            <span
              className={isConfigured ? "text-success" : "text-warning"}
              style={{ fontWeight: "bold" }}
            >
              {isConfigured ? "✓ تم الإعداد" : "⚠ يحتاج إعداد"}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>Sender Name:</span>
            <span style={{ fontWeight: "bold" }}>
              {sender !== "your-sender-name" ? sender : "⚠ يحتاج إعداد"}
            </span>
          </div>
        </div>

        {!isConfigured && (
          <div
            className="alert alert-warning"
            style={{ marginTop: "var(--spacing-md)" }}
          >
            <strong>⚠ يرجى إعداد SMS API</strong>
            <p style={{ marginTop: "var(--spacing-sm)", marginBottom: 0 }}>
              قم بتحديث ملف .env بمعلومات API الخاصة بك من HTD
            </p>
          </div>
        )}

        {!enabled && (
          <div
            className="alert alert-info"
            style={{ marginTop: "var(--spacing-md)" }}
          >
            <strong>ℹ SMS معطّل</strong>
            <p style={{ marginTop: "var(--spacing-sm)", marginBottom: 0 }}>
              لتفعيل SMS، قم بتعيين VITE_SMS_ENABLED=true في ملف .env
            </p>
          </div>
        )}
      </div>

      {/* Test Form */}
      <div className="card">
        <h3 style={{ marginBottom: "var(--spacing-md)" }}>
          إرسال رسالة تجريبية
        </h3>

        <form onSubmit={handleTest}>
          <div className="form-group">
            <label className="form-label">رقم الهاتف *</label>
            <input
              type="tel"
              className="form-input"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="0599123456"
              required
            />
            <small
              className="text-muted"
              style={{ display: "block", marginTop: "var(--spacing-sm)" }}
            >
              مثال: 0599123456 أو 970599123456
            </small>
            {phoneNumber && (
              <small
                style={{ display: "block", marginTop: "var(--spacing-sm)" }}
              >
                {isValidPhoneNumber(phoneNumber) ? (
                  <span className="text-success">
                    ✓ رقم صحيح: {formatPhoneNumber(phoneNumber)}
                  </span>
                ) : (
                  <span className="text-danger">✗ رقم غير صحيح</span>
                )}
              </small>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">نص الرسالة *</label>
            <textarea
              className="form-textarea"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="اكتب رسالتك هنا..."
              rows="4"
              required
              style={{ minHeight: "100px" }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: "var(--spacing-sm)",
              }}
            >
              <small className="text-muted">عدد الأحرف: {message.length}</small>
              <button
                type="button"
                className="btn-preset"
                onClick={testWithSample}
                style={{
                  fontSize: "0.875rem",
                  padding: "var(--spacing-xs) var(--spacing-sm)",
                }}
              >
                استخدم نص تجريبي
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !isConfigured}
            style={{ width: "100%" }}
          >
            {loading ? "جاري الإرسال..." : "إرسال الرسالة التجريبية"}
          </button>
        </form>

        {/* Result */}
        {result && (
          <div
            className={`alert ${
              result.success ? "alert-success" : "alert-error"
            }`}
            style={{ marginTop: "var(--spacing-lg)" }}
          >
            <strong>
              {result.success ? "✓ نجح الإرسال" : "✗ فشل الإرسال"}
            </strong>
            <p style={{ marginTop: "var(--spacing-sm)", marginBottom: 0 }}>
              {result.message}
            </p>
            {result.response && (
              <small
                style={{
                  display: "block",
                  marginTop: "var(--spacing-sm)",
                  opacity: 0.8,
                }}
              >
                الرد من الخادم: {result.response}
              </small>
            )}
          </div>
        )}
      </div>

      {/* Documentation Link */}
      <div
        className="card"
        style={{ marginTop: "var(--spacing-lg)", textAlign: "center" }}
      >
        <p style={{ marginBottom: "var(--spacing-sm)" }}>
          📚 لمزيد من المعلومات، راجع ملف <code>SMS_SETUP.md</code>
        </p>
        <small className="text-muted">
          يحتوي على دليل كامل لإعداد واستخدام نظام SMS
        </small>
      </div>
    </div>
  );
};

export default SMSTest;
