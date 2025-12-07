import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import { sendDebtNotification, sendPaymentNotification } from "./smsService";

const TRANSACTIONS_COLLECTION = "transactions";

// Add a debt transaction
export const addDebt = async (debtData, userId, customerPhone = null) => {
  try {
    const docRef = await addDoc(collection(db, TRANSACTIONS_COLLECTION), {
      type: "debt",
      customerId: debtData.customerId,
      customerName: debtData.customerName,
      transactionType: debtData.transactionType, // 'debt' or 'cash'
      description: debtData.description,
      amount: parseFloat(debtData.amount),
      userId,
      createdAt: Timestamp.now(),
    });

    // Calculate current balance after this transaction
    if (customerPhone) {
      try {
        const transactions = await getTransactionsByCustomer(
          debtData.customerId,
          userId
        );
        const currentBalance = calculateBalance(transactions);

        // Send SMS notification
        await sendDebtNotification({
          customerName: debtData.customerName,
          customerPhone: customerPhone,
          amount: parseFloat(debtData.amount),
          description: debtData.description,
          transactionType: debtData.transactionType,
          currentBalance: currentBalance,
        });
      } catch (smsError) {
        console.error("Error sending SMS notification:", smsError);
        // Don't fail the transaction if SMS fails
      }
    }

    return { id: docRef.id, ...debtData };
  } catch (error) {
    console.error("Error adding debt:", error);
    throw error;
  }
};

// Add a payment transaction
export const addPayment = async (paymentData, userId, customerPhone = null) => {
  try {
    const docRef = await addDoc(collection(db, TRANSACTIONS_COLLECTION), {
      type: "payment",
      customerId: paymentData.customerId,
      customerName: paymentData.customerName,
      amount: parseFloat(paymentData.amount),
      userId,
      createdAt: Timestamp.now(),
    });

    // Calculate current balance after this transaction
    if (customerPhone) {
      try {
        const transactions = await getTransactionsByCustomer(
          paymentData.customerId,
          userId
        );
        const currentBalance = calculateBalance(transactions);

        // Send SMS notification
        await sendPaymentNotification({
          customerName: paymentData.customerName,
          customerPhone: customerPhone,
          amount: parseFloat(paymentData.amount),
          currentBalance: currentBalance,
        });
      } catch (smsError) {
        console.error("Error sending SMS notification:", smsError);
        // Don't fail the transaction if SMS fails
      }
    }

    return { id: docRef.id, ...paymentData };
  } catch (error) {
    console.error("Error adding payment:", error);
    throw error;
  }
};

// Get all transactions for a specific customer
export const getTransactionsByCustomer = async (customerId, userId) => {
  try {
    const q = query(
      collection(db, TRANSACTIONS_COLLECTION),
      where("customerId", "==", customerId),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error getting transactions:", error);
    throw error;
  }
};

// Calculate balance for a customer
// Balance = sum(debts where transactionType === 'debt') - sum(payments)
// Cash transactions are NOT included in balance
export const calculateBalance = (transactions) => {
  let totalDebts = 0;
  let totalPayments = 0;

  transactions.forEach((transaction) => {
    if (transaction.type === "debt" && transaction.transactionType === "debt") {
      totalDebts += transaction.amount;
    } else if (transaction.type === "payment") {
      totalPayments += transaction.amount;
    }
  });

  return totalDebts - totalPayments;
};

// Delete all transactions for a customer
export const deleteTransactionsByCustomer = async (customerId, userId) => {
  try {
    const q = query(
      collection(db, TRANSACTIONS_COLLECTION),
      where("customerId", "==", customerId),
      where("userId", "==", userId)
    );
    const querySnapshot = await getDocs(q);

    // Delete all transactions
    const deletePromises = querySnapshot.docs.map((doc) => deleteDoc(doc.ref));

    await Promise.all(deletePromises);
  } catch (error) {
    console.error("Error deleting transactions:", error);
    throw error;
  }
};

// Delete a single transaction
export const deleteTransaction = async (transactionId) => {
  try {
    const transactionRef = doc(db, TRANSACTIONS_COLLECTION, transactionId);
    await deleteDoc(transactionRef);
  } catch (error) {
    console.error("Error deleting transaction:", error);
    throw error;
  }
};

// Update a transaction
export const updateTransaction = async (transactionId, transactionData) => {
  try {
    const transactionRef = doc(db, TRANSACTIONS_COLLECTION, transactionId);
    await updateDoc(transactionRef, {
      ...transactionData,
      updatedAt: Timestamp.now(),
    });
    return { id: transactionId, ...transactionData };
  } catch (error) {
    console.error("Error updating transaction:", error);
    throw error;
  }
};

// Get all transactions for a user (for statistics)
export const getAllTransactions = async (userId) => {
  try {
    const q = query(
      collection(db, TRANSACTIONS_COLLECTION),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Error getting all transactions:", error);
    throw error;
  }
};
