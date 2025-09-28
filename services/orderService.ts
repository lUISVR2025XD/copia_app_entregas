
import { Order, OrderStatus } from '../types';

const ORDER_DB_KEY = 'orderDB';
const MOCK_ORDERS_INITIAL: Order[] = []; 

const initializeOrderDB = (): Order[] => {
    const db = localStorage.getItem(ORDER_DB_KEY);
    if (db) {
        try {
            return JSON.parse(db);
        } catch (e) {
            console.error("Could not parse orderDB, resetting.", e);
            localStorage.setItem(ORDER_DB_KEY, JSON.stringify(MOCK_ORDERS_INITIAL));
            return MOCK_ORDERS_INITIAL;
        }
    }
    localStorage.setItem(ORDER_DB_KEY, JSON.stringify(MOCK_ORDERS_INITIAL));
    return MOCK_ORDERS_INITIAL;
};

let orderDB = initializeOrderDB();

const saveDB = () => {
    localStorage.setItem(ORDER_DB_KEY, JSON.stringify(orderDB));
};

export const orderService = {
    getOrders: (filters: { businessId?: string; clientId?: string; status?: OrderStatus }): Promise<Order[]> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                orderDB = initializeOrderDB(); // Re-sync with localStorage
                let orders = [...orderDB];
                if (filters.businessId) {
                    orders = orders.filter(o => o.business_id === filters.businessId);
                }
                if (filters.clientId) {
                    orders = orders.filter(o => o.client_id === filters.clientId);
                }
                if (filters.status) {
                    orders = orders.filter(o => o.status === filters.status);
                }
                resolve(orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
            }, 200);
        });
    },
    
    createOrder: (newOrder: Order): Promise<Order> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                orderDB.unshift(newOrder);
                saveDB();
                resolve(newOrder);
            }, 200);
        });
    },

    updateOrder: (orderId: string, updates: Partial<Order>): Promise<Order | null> => {
        return new Promise((resolve, reject) => {
             setTimeout(() => {
                const orderIndex = orderDB.findIndex(o => o.id === orderId);
                if (orderIndex === -1) {
                    return reject(new Error('Order not found'));
                }
                orderDB[orderIndex] = { ...orderDB[orderIndex], ...updates };
                saveDB();
                resolve(orderDB[orderIndex]);
            }, 200);
        });
    },
};
