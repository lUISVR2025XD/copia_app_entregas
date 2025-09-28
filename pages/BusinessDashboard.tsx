

import React, { useState, useEffect } from 'react';
import { Profile, Order, OrderStatus, UserRole, Notification } from '../types';
import Button from '../components/ui/Button';
import { Check, X, UtensilsCrossed, DollarSign, ClipboardList, TrendingUp, Clock, Package, Bike } from 'lucide-react';
import DashboardHeader from '../components/shared/DashboardHeader';
import { notificationService } from '../services/notificationService';
import { orderService } from '../services/orderService';
import StatsCard from '../components/ui/StatsCard';
import Modal from '../components/ui/Modal';
import BusinessOrderCard from '../components/business/BusinessOrderCard';


interface BusinessDashboardProps {
  user: Profile;
  onLogout: () => void;
}

const BusinessDashboard: React.FC<BusinessDashboardProps> = ({ user, onLogout }) => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [view, setView] = useState<'orders' | 'overview'>('orders');
    const [isPrepTimeModalOpen, setIsPrepTimeModalOpen] = useState(false);
    const [orderToAccept, setOrderToAccept] = useState<Order | null>(null);
    const [prepTime, setPrepTime] = useState(15);

    useEffect(() => {
        const fetchOrders = async () => {
            setIsLoading(true);
            const fetchedOrders = await orderService.getOrders({ businessId: user.id });
            setOrders(fetchedOrders);
            setIsLoading(false);
        };
        fetchOrders();
    }, [user.id]);

    useEffect(() => {
        const handleNotification = (notification: Notification) => {
          if (notification.role !== user.role) return;

          // Handle new orders for real-time update
          if (notification.type === 'new_order' && notification.order) {
            setOrders(prev => {
                if (prev.find(o => o.id === notification.order?.id)) return prev;
                return [notification.order, ...prev];
            });
            return;
          }
          
          // Handle status updates on existing orders
          if (notification.orderId) {
            let newStatus: OrderStatus | null = null;
            if (notification.title === 'Pedido Recogido') {
              newStatus = OrderStatus.ON_THE_WAY;
            } else if (notification.title === '¡Pedido Entregado!') {
              newStatus = OrderStatus.DELIVERED;
            }

            if (newStatus) {
              setOrders(prev => prev.map(o => 
                o.id === notification.orderId ? { ...o, status: newStatus as OrderStatus } : o
              ));
            }
          }
        };
    
        const unsubscribe = notificationService.subscribe(handleNotification);
        return () => unsubscribe();
    }, [user.role]);

    const handleOpenPrepTimeModal = (order: Order) => {
        setOrderToAccept(order);
        setIsPrepTimeModalOpen(true);
    };

    const handleConfirmAccept = async () => {
        if (orderToAccept) {
            await handleUpdateStatus(orderToAccept.id, OrderStatus.IN_PREPARATION, prepTime);
        }
        setIsPrepTimeModalOpen(false);
        setOrderToAccept(null);
    };
    
    const handleUpdateStatus = async (id: string, status: OrderStatus, prepTimeValue?: number) => {
        const updates: Partial<Order> = { status };
        if (prepTimeValue) {
            updates.preparation_time = prepTimeValue;
        }

        try {
            const updatedOrder = await orderService.updateOrder(id, updates);
            if (updatedOrder) {
                setOrders(prevOrders => prevOrders.map(o => o.id === id ? updatedOrder : o));
                
                // Send notifications AFTER successful update
                if (status === OrderStatus.IN_PREPARATION) {
                    notificationService.sendNotification({
                        id: `note-accepted-${Date.now()}`,
                        role: UserRole.CLIENT, orderId: id,
                        title: 'Pedido Confirmado',
                        message: `¡${user.name} ha aceptado tu pedido y lo está preparando! Tiempo estimado: ${prepTimeValue} min.`,
                        type: 'success', icon: Check,
                    });
                }
                
                if (status === OrderStatus.REJECTED) {
                    notificationService.sendNotification({
                        id: `note-rejected-${Date.now()}`,
                        role: UserRole.CLIENT, orderId: id,
                        title: 'Pedido Rechazado',
                        message: `Lo sentimos, ${user.name} no pudo aceptar tu pedido en este momento.`,
                        type: 'error', icon: X,
                    });
                }
                
                if (status === OrderStatus.READY_FOR_PICKUP) {
                     notificationService.sendNotification({
                        id: `note-ready-${Date.now()}`,
                        role: UserRole.DELIVERY, orderId: id,
                        order: updatedOrder,
                        title: 'Pedido Listo para Recoger',
                        message: `El pedido #${id.slice(-6)} de ${user.name} está listo.`,
                        type: 'info', icon: Package,
                    });
                    notificationService.sendNotification({
                        id: `note-ready-client-${Date.now()}`,
                        role: UserRole.CLIENT, orderId: id,
                        title: '¡Tu pedido está listo!',
                        message: `Tu pedido de ${user.name} está listo y esperando a un repartidor.`,
                        type: 'info', icon: Package,
                    });
                }
            }
        } catch (error) {
            console.error("Failed to update order status:", error);
            // Optionally: show an error toast to the business user
        }
    };

    const newOrders = orders.filter(o => o.status === OrderStatus.PENDING);
    const activeOrders = orders.filter(o => [OrderStatus.IN_PREPARATION, OrderStatus.READY_FOR_PICKUP, OrderStatus.ON_THE_WAY].includes(o.status));

    const renderOrders = () => (
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
            <div>
                <h2 className="text-2xl font-bold mb-4">Nuevos Pedidos ({newOrders.length})</h2>
                {isLoading ? <p>Cargando...</p> : (
                    <div className="space-y-4">
                        {newOrders.length > 0 ? (
                            newOrders.map(order => (
                                <BusinessOrderCard 
                                    key={order.id} 
                                    order={order}
                                    onAccept={handleOpenPrepTimeModal}
                                    onReject={(id) => handleUpdateStatus(id, OrderStatus.REJECTED)}
                                    onReady={(id) => handleUpdateStatus(id, OrderStatus.READY_FOR_PICKUP)}
                                />
                            ))
                        ) : (
                            <p className="text-gray-400 p-4 bg-black/20 rounded-lg text-center">No hay pedidos nuevos.</p>
                        )}
                    </div>
                )}
            </div>
             <div>
                <h2 className="text-2xl font-bold mb-4">Pedidos Activos ({activeOrders.length})</h2>
                 {isLoading ? <p>Cargando...</p> : (
                    <div className="space-y-4">
                         {activeOrders.length > 0 ? (
                            activeOrders.map(order => (
                                 <BusinessOrderCard 
                                    key={order.id} 
                                    order={order}
                                    onAccept={handleOpenPrepTimeModal}
                                    onReject={(id) => handleUpdateStatus(id, OrderStatus.REJECTED)}
                                    onReady={(id) => handleUpdateStatus(id, OrderStatus.READY_FOR_PICKUP)}
                                />
                            ))
                        ) : (
                            <p className="text-gray-400 p-4 bg-black/20 rounded-lg text-center">No hay pedidos en preparación.</p>
                        )}
                    </div>
                 )}
            </div>
        </div>
    );

    const renderOverview = () => (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <StatsCard title="Ingresos Totales" value="0.00" subtitle="+12.5%" icon={<DollarSign size={28} className="text-white"/>} iconBgColor="#00A88B" className="bg-gradient-to-br from-[#014D4A] to-[#013735]" />
            <StatsCard title="Pedidos Hoy" value="0" subtitle="+8.2%" icon={<ClipboardList size={28} className="text-white"/>} iconBgColor="#3F7FBF" className="bg-gradient-to-br from-[#014D4A] to-[#013735]" />
            <StatsCard title="Pedidos Pendientes" value={newOrders.length.toString()} subtitle="Ahora mismo" icon={<Clock size={28} className="text-white"/>} iconBgColor="#F2994A" className="bg-gradient-to-br from-[#014D4A] to-[#013735]" />
            <StatsCard title="Pedidos Activos" value={activeOrders.length.toString()} subtitle={`${activeOrders.length} en proceso`} icon={<TrendingUp size={28} className="text-white"/>} iconBgColor="#9B51E0" className="bg-gradient-to-br from-[#014D4A] to-[#013735]" />
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#012D2D] to-[#001C1C] text-white">
            <DashboardHeader userName={user.name} onLogout={onLogout} title="vrtelolleva Business" />
            <main className="p-4 md:p-8">
                 <div className="flex border-b border-white/10 mb-6">
                    <button onClick={() => setView('orders')} className={`px-4 py-3 font-semibold transition-colors ${view === 'orders' ? 'text-white border-b-2 border-teal-400' : 'text-gray-400 hover:text-white'}`}>
                        Pedidos ({newOrders.length + activeOrders.length})
                    </button>
                    <button onClick={() => setView('overview')} className={`px-4 py-3 font-semibold transition-colors ${view === 'overview' ? 'text-white border-b-2 border-teal-400' : 'text-gray-400 hover:text-white'}`}>
                        Estadísticas
                    </button>
                </div>
                
                {view === 'orders' ? renderOrders() : renderOverview()}
            </main>
            <Modal isOpen={isPrepTimeModalOpen} onClose={() => setIsPrepTimeModalOpen(false)} title="Confirmar Pedido">
                <div>
                    <label htmlFor="prepTime" className="block text-sm font-medium text-gray-300 mb-2">
                        Tiempo de preparación estimado (minutos):
                    </label>
                    <input 
                        type="number"
                        id="prepTime"
                        value={prepTime}
                        onChange={(e) => setPrepTime(Number(e.target.value))}
                        className="w-full p-2 border rounded-md bg-transparent border-white/20 focus:ring-teal-500 focus:border-teal-500"
                        min="5"
                        step="5"
                    />
                    <div className="flex justify-end gap-4 mt-6">
                        <Button variant="secondary" onClick={() => setIsPrepTimeModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleConfirmAccept} className="bg-teal-600 hover:bg-teal-700">Confirmar Pedido</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default BusinessDashboard;