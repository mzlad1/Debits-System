import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  Timestamp,
  doc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from './firebase';

const CUSTOMERS_COLLECTION = 'customers';

// Add a new customer
export const addCustomer = async (customerData, userId) => {
  try {
    const docRef = await addDoc(collection(db, CUSTOMERS_COLLECTION), {
      ...customerData,
      userId,
      createdAt: Timestamp.now()
    });
    return { id: docRef.id, ...customerData };
  } catch (error) {
    console.error('Error adding customer:', error);
    throw error;
  }
};

// Get all customers for a user
export const getCustomers = async (userId) => {
  try {
    const q = query(
      collection(db, CUSTOMERS_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting customers:', error);
    throw error;
  }
};

// Search customers by name
export const searchCustomers = async (userId, searchTerm) => {
  try {
    const customers = await getCustomers(userId);
    if (!searchTerm) return customers;
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    return customers.filter(customer => 
      customer.name.toLowerCase().includes(lowerSearchTerm)
    );
  } catch (error) {
    console.error('Error searching customers:', error);
    throw error;
  }
};

// Update a customer
export const updateCustomer = async (customerId, customerData) => {
  try {
    const customerRef = doc(db, CUSTOMERS_COLLECTION, customerId);
    await updateDoc(customerRef, {
      ...customerData,
      updatedAt: Timestamp.now()
    });
    return { id: customerId, ...customerData };
  } catch (error) {
    console.error('Error updating customer:', error);
    throw error;
  }
};

// Delete a customer
export const deleteCustomer = async (customerId) => {
  try {
    const customerRef = doc(db, CUSTOMERS_COLLECTION, customerId);
    await deleteDoc(customerRef);
  } catch (error) {
    console.error('Error deleting customer:', error);
    throw error;
  }
};
