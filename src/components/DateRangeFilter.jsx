import React, { useState, useEffect } from "react";
import { getAllTransactions } from "../services/transactionService";
import { useAuth } from "../context/AuthContext";

const DateRangeFilter = () => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statistics, setStatistics] = useState({
    totalDebts: 0,
    totalPayments: 0,
    totalCash: 0,
    netBalance: 0,
    transactionCount: 0,
  });
  const [loading, setLoading] = useState(false);
  const [showStats, setShowStats] = useState(false);

  const { user } = useAuth();

  // Set default dates (current month)
  useEffect(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    setStartDate(formatDateForInput(firstDay));
    setEndDate(formatDateForInput(lastDay));
  }, []);

  const formatDateForInput = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const calculateStatistics = async () => {
    if (!startDate || !endDate) {
      alert("الرجاء اختيار تاريخ البداية والنهاية");
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      alert("تاريخ البداية يجب أن يكون قبل تاريخ النهاية");
      return;
    }

    setLoading(true);
    try {
      const transactions = await getAllTransactions(user.uid);

      // Filter transactions by date range
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      const filteredTransactions = transactions.filter((transaction) => {
        const transDate = transaction.createdAt?.toDate
          ? transaction.createdAt.toDate()
          : new Date(transaction.createdAt);
        return transDate >= start && transDate <= end;
      });

      // Calculate statistics
      let totalDebts = 0;
      let totalPayments = 0;
      let totalCash = 0;

      filteredTransactions.forEach((transaction) => {
        if (transaction.type === "debt") {
          if (transaction.transactionType === "debt") {
            totalDebts += transaction.amount;
          } else if (transaction.transactionType === "cash") {
            totalCash += transaction.amount;
          }
        } else if (transaction.type === "payment") {
          totalPayments += transaction.amount;
        }
      });

      const netBalance = totalDebts - totalPayments;

      setStatistics({
        totalDebts,
        totalPayments,
        totalCash,
        netBalance,
        transactionCount: filteredTransactions.length,
      });
      setShowStats(true);
    } catch (error) {
      console.error("Error calculating statistics:", error);
      alert("حدث خطأ أثناء حساب الإحصائيات");
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

  const setPresetRange = (preset) => {
    const today = new Date();
    let start, end;

    switch (preset) {
      case "today":
        start = end = today;
        break;
      case "yesterday":
        start = end = new Date(today.setDate(today.getDate() - 1));
        break;
      case "thisWeek":
        start = new Date(today.setDate(today.getDate() - today.getDay()));
        end = new Date();
        break;
      case "thisMonth":
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      case "lastMonth":
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        end = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case "thisYear":
        start = new Date(today.getFullYear(), 0, 1);
        end = new Date(today.getFullYear(), 11, 31);
        break;
      default:
        return;
    }

    setStartDate(formatDateForInput(start));
    setEndDate(formatDateForInput(end));
  };

  return (
    <div className="date-range-filter-container">
      <div className="card">
        <h3 style={{ marginBottom: "1rem", color: "var(--primary)" }}>
          📊 إحصائيات حسب الفترة الزمنية
        </h3>

        {/* Preset Buttons */}
        <div className="preset-buttons">
          <button
            className="btn-preset"
            onClick={() => setPresetRange("today")}
          >
            اليوم
          </button>
          <button
            className="btn-preset"
            onClick={() => setPresetRange("yesterday")}
          >
            أمس
          </button>
          <button
            className="btn-preset"
            onClick={() => setPresetRange("thisWeek")}
          >
            هذا الأسبوع
          </button>
          <button
            className="btn-preset"
            onClick={() => setPresetRange("thisMonth")}
          >
            هذا الشهر
          </button>
          <button
            className="btn-preset"
            onClick={() => setPresetRange("lastMonth")}
          >
            الشهر الماضي
          </button>
          <button
            className="btn-preset"
            onClick={() => setPresetRange("thisYear")}
          >
            هذا العام
          </button>
        </div>

        {/* Date Inputs */}
        <div className="date-inputs">
          <div className="date-input-group">
            <label>من تاريخ:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="date-input"
            />
          </div>
          <div className="date-input-group">
            <label>إلى تاريخ:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="date-input"
            />
          </div>
          <button
            className="btn btn-primary"
            onClick={calculateStatistics}
            disabled={loading}
          >
            {loading ? "جاري الحساب..." : "عرض الإحصائيات"}
          </button>
        </div>

        {/* Statistics Display */}
        {showStats && (
          <div className="statistics-grid">
            <div className="stat-card stat-info">
              <div className="stat-icon">📝</div>
              <div className="stat-content">
                <div className="stat-label">عدد المعاملات</div>
                <div className="stat-value">{statistics.transactionCount}</div>
              </div>
            </div>

            <div className="stat-card stat-danger">
              <div className="stat-icon">📤</div>
              <div className="stat-content">
                <div className="stat-label">إجمالي الديون</div>
                <div className="stat-value">
                  {formatCurrency(statistics.totalDebts)}
                </div>
              </div>
            </div>

            <div className="stat-card stat-success">
              <div className="stat-icon">💰</div>
              <div className="stat-content">
                <div className="stat-label">إجمالي الدفعات</div>
                <div className="stat-value">
                  {formatCurrency(statistics.totalPayments)}
                </div>
              </div>
            </div>

            <div className="stat-card stat-warning">
              <div className="stat-icon">💵</div>
              <div className="stat-content">
                <div className="stat-label">معاملات كاش</div>
                <div className="stat-value">
                  {formatCurrency(statistics.totalCash)}
                </div>
              </div>
            </div>

            <div
              className={`stat-card stat-highlight ${
                statistics.netBalance >= 0
                  ? "stat-net-positive"
                  : "stat-net-negative"
              }`}
            >
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <div className="stat-label">الرصيد الصافي</div>
                <div className="stat-value">
                  {formatCurrency(Math.abs(statistics.netBalance))}
                  <span className="stat-badge">
                    {statistics.netBalance >= 0 ? "دين" : "رصيد"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DateRangeFilter;
