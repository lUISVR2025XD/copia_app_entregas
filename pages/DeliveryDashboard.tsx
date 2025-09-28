
import React, { useState, useEffect } from 'react';
import { Profile, Order, OrderStatus, DeliveryPerson, UserRole, Notification, QuickMessage } from '../types';
import { ORDER_STATUS_MAP, QUICK_MESSAGES_DELIVERY } from '../constants';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import OrderTrackingMap from '../components/maps/OrderTrackingMap';
import { MessageSquare, Bike, DollarSign, Clock, BarChart, Power, Menu, PackageCheck, Check } from 'lucide-react';
import { notificationService } from '../services/notificationService';
import StatsCard from '../components/ui/StatsCard';
import { orderService } from '../services/orderService';


interface DeliveryDashboardProps {
  user: Profile;
  onLogout: () => void;
}

const DeliveryDashboard: React.FC<DeliveryDashboardProps> = ({ user, onLogout }) => {
    const [isOnline, setIsOnline] = useState<boolean>(() => {
        const savedStatus = localStorage.getItem(`deliveryDriverIsOnline_${user.id}`);
        // Default to true on first visit or if saved as true
        return savedStatus === null ? true : JSON.parse(savedStatus);
    });

    const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
    const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
    const [sentMessage, setSentMessage] = useState<string | null>(null);
    const [deliveryPerson, setDeliveryPerson] = useState<DeliveryPerson>({
         id: user.id, name: user.name, is_online: isOnline, location: { lat: 19.4280, lng: -99.1380 }, vehicle: 'Moto', rating: 4.9, rating_count: 45, current_deliveries: 0, email: user.email, phone: user.phone || ''
    });
     
    useEffect(() => {
        setDeliveryPerson(prev => ({ ...prev, is_online: isOnline }));
    }, [isOnline]);

    useEffect(() => {
        const loadDriverState = async () => {
            // Check for an active order assigned to this driver
            const allOnTheWayOrders = await orderService.getOrders({ status: OrderStatus.ON_THE_WAY });
            const myCurrentOrder = allOnTheWayOrders.find(o => o.delivery_person_id === user.id);

            if (myCurrentOrder) {
                setCurrentOrder(myCurrentOrder);
                setAvailableOrders([]);
            } else if (isOnline) {
                // If no active order and online, fetch available orders
                const readyOrders = await orderService.getOrders({ status: OrderStatus.READY_FOR_PICKUP });
                setAvailableOrders(readyOrders);
            } else {
                setAvailableOrders([]);
            }
        };

        loadDriverState();

        const handleNotification = (notification: Notification) => {
          if (notification.role !== UserRole.DELIVERY) return;

          // Handle message from client (which comes with updated order)
          if (notification.order && currentOrder && notification.orderId === currentOrder.id && notification.title === 'Mensaje del Cliente') {
              setCurrentOrder(notification.order);
              return;
          }

          // A new order is ready for pickup, and I'm online and free
          if (isOnline && !currentOrder && notification.order && notification.title === 'Pedido Listo para Recoger') {
            setAvailableOrders(prev => {
                if (prev.find(o => o.id === notification.order!.id)) return prev;
                return [notification.order, ...prev];
            });
          }
        };
    
        const unsubscribe = notificationService.subscribe(handleNotification);
        return () => unsubscribe();
    }, [isOnline, user.id, currentOrder]);

    const toggleOnlineStatus = () => {
        setIsOnline(prev => {
            const newStatus = !prev;
            localStorage.setItem(`deliveryDriverIsOnline_${user.id}`, JSON.stringify(newStatus));
            return newStatus;
        });
    };

    const handleAcceptOrder = async (order: Order) => {
        const updates: Partial<Order> = {
            status: OrderStatus.ON_THE_WAY,
            delivery_person_id: user.id,
            delivery_person: deliveryPerson
        };
        const updatedOrder = await orderService.updateOrder(order.id, updates);
        
        if (updatedOrder) {
            setCurrentOrder(updatedOrder);
            setAvailableOrders([]);
            
            notificationService.sendNotification({
                id: `note-onway-${Date.now()}`,
                role: UserRole.CLIENT,
                orderId: order.id,
                order: updatedOrder,
                title: '¡Tu pedido está en camino!',
                message: `${user.name} ha recogido tu pedido de ${order.business?.name}.`,
                type: 'info',
                icon: Bike,
            });

            notificationService.sendNotification({
                id: `note-pickedup-biz-${Date.now()}`,
                role: UserRole.BUSINESS,
                orderId: order.id,
                order: updatedOrder,
                title: 'Pedido Recogido',
                message: `El repartidor ${user.name} ha recogido el pedido #${order.id.slice(-6)}.`,
                type: 'info',
                icon: Bike
            });
        }
    };

    const handleUpdateStatus = async (status: OrderStatus) => {
        if(currentOrder) {
            const updatedOrder = await orderService.updateOrder(currentOrder.id, { status });

            if(updatedOrder && status === OrderStatus.DELIVERED) {
                notificationService.sendNotification({
                    id: `note-delivered-${Date.now()}`,
                    role: UserRole.CLIENT,
                    orderId: currentOrder.id,
                    order: updatedOrder,
                    title: '¡Pedido Entregado!',
                    message: `Tu pedido de ${currentOrder.business?.name} ha sido entregado por ${user.name}. ¡Buen provecho!`,
                    type: 'success',
                    icon: PackageCheck
                });

                notificationService.sendNotification({
                    id: `note-delivered-biz-${Date.now()}`,
                    role: UserRole.BUSINESS,
                    orderId: currentOrder.id,
                    order: updatedOrder,
                    title: '¡Pedido Entregado!',
                    message: `El pedido #${currentOrder.id.slice(-6)} ha sido entregado.`,
                    type: 'success',
                    icon: PackageCheck
                });

                setCurrentOrder(null);
                // After finishing an order, check for new ones if online.
                if(isOnline) {
                    const readyOrders = await orderService.getOrders({ status: OrderStatus.READY_FOR_PICKUP });
                    setAvailableOrders(readyOrders);
                }
            } else if (updatedOrder) {
                setCurrentOrder(updatedOrder);
            }
        }
    }
    
    const sendQuickMessage = async (message: string) => {
        if (!currentOrder || sentMessage) return;
    
        const quickMessage: QuickMessage = {
            id: `msg-${Date.now()}`,
            order_id: currentOrder.id,
            sender_id: user.id,
            recipient_id: currentOrder.client_id,
            message: message,
            created_at: new Date().toISOString(),
            is_read: false,
        };
    
        const updatedOrder = await orderService.addMessageToOrder(currentOrder.id, quickMessage);
        
        if (updatedOrder) {
            setCurrentOrder(updatedOrder);
    
            notificationService.sendNotification({
                id: `note-msg-delivery-${Date.now()}`,
                role: UserRole.CLIENT,
                orderId: currentOrder.id,
                order: updatedOrder,
                title: 'Mensaje del Repartidor',
                message: `${user.name}: "${message}"`,
                type: 'info',
                icon: MessageSquare
            });
    
            notificationService.sendNotification({
                id: `note-msg-delivery-confirm-${Date.now()}`,
                role: UserRole.DELIVERY,
                orderId: currentOrder.id,
                title: 'Mensaje Enviado',
                message: `Tu mensaje fue enviado al cliente.`,
                type: 'success',
                icon: Check
            });
            
            setSentMessage(message);
            setTimeout(() => {
                setSentMessage(null);
            }, 3000);
        }
    }

    const renderCurrentOrder = () => {
        if(!currentOrder) return null;
        const statusInfo = ORDER_STATUS_MAP[currentOrder.status];
        return (
            <>
                <h2 className="text-3xl font-bold mb-4">Entrega Actual</h2>
                <Card className="bg-transparent p-0">
                    <OrderTrackingMap 
                        center={deliveryPerson.location}
                        businessLocation={currentOrder.business?.location}
                        deliveryLocation={deliveryPerson.location}
                        clientLocation={currentOrder.delivery_location}
                        className="h-96 w-full rounded-t-2xl"
                    />
                    <div className="p-4 bg-gradient-to-br from-[#5A0000] to-[#400000] rounded-b-2xl">
                        <div className="flex justify-between items-center">
                            <h4 className="font-bold text-lg">Pedido #{currentOrder.id.slice(-6)}</h4>
                            <div className={`px-3 py-1 rounded-full text-white text-sm font-semibold ${statusInfo.color}`}>{statusInfo.text}</div>
                        </div>
                        <p><b>Recoger en:</b> {currentOrder.business?.name}</p>
                        <p><b>Entregar en:</b> {currentOrder.delivery_address}</p>
                        
                        <div className="my-3 border-t border-white/20"></div>

                        {currentOrder.messages && currentOrder.messages.length > 0 && (
                            <div className="mb-4">
                                <h5 className="font-semibold mb-2 flex items-center"><MessageSquare className="inline-block mr-2 h-5 w-5 text-purple-400"/> Mensajes</h5>
                                <div className="space-y-2 bg-black/20 p-3 rounded-lg max-h-24 overflow-y-auto">
                                    {currentOrder.messages.map(msg => (
                                        <p key={msg.id} className="text-sm text-gray-300">
                                            <span className={`font-semibold ${msg.sender_id === user.id ? 'text-green-300' : 'text-purple-300'}`}>
                                                {msg.sender_id === user.id ? 'Tú' : 'Cliente'}:
                                            </span> {msg.message}
                                        </p>
                                    ))}
                                </div>
                            </div>
                        )}

                         <div className="mb-4">
                             <h5 className="font-semibold mb-2">Mensajes Rápidos al Cliente</h5>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                 {QUICK_MESSAGES_DELIVERY.map(msg => {
                                    const isSent = sentMessage === msg;
                                     return (
                                     <Button 
                                         key={msg} 
                                         variant="secondary" 
                                         onClick={() => sendQuickMessage(msg)} 
                                         className={`text-sm w-full text-left p-3 h-auto justify-start transition-colors ${
                                             isSent
                                             ? '!bg-green-500 !text-white'
                                             : ''
                                         }`}
                                         disabled={sentMessage !== null}
                                     >
                                         {isSent ? (
                                             <div className="flex items-center">
                                                 <Check className="w-5 h-5 mr-2" />
                                                 Enviado
                                             </div>
                                         ) : (
                                             <>
                                                 <MessageSquare className="inline-block mr-2 h-4 w-4"/> {msg}
                                             </>
                                         )}
                                     </Button>
                                     )
                                 })}
                             </div>
                         </div>

                        {currentOrder.status === OrderStatus.ON_THE_WAY && (
                            <Button onClick={() => handleUpdateStatus(OrderStatus.DELIVERED)} className="w-full mt-2 bg-green-600 hover:bg-green-700">Marcar como Entregado</Button>
                        )}
                    </div>
                </Card>
            </>
        )
    }

    const renderAvailableOrders = () => (
        <>
            <h2 className="text-3xl font-bold mb-4">Pedidos Disponibles</h2>
            {!isOnline ? (
                <p className="bg-white text-gray-700 p-4 rounded-lg text-center shadow">Ponte en línea para ver pedidos.</p>
            ) : availableOrders.length > 0 ? (
                availableOrders.map(order => (
                    <Card key={order.id} className="p-4 mb-4 bg-gradient-to-br from-[#5A0000] to-[#400000]">
                        <h4 className="font-bold">Recoger en {order.business?.name}</h4>
                        <p className="text-sm">Entregar en: {order.delivery_address}</p>
                        <p className="font-bold text-lg mt-2">Ganancia: ${(order.total_price * 0.15 + 20).toFixed(2)}</p>
                        <Button onClick={() => handleAcceptOrder(order)} className="w-full mt-4 bg-green-600 hover:bg-green-700">Aceptar Pedido</Button>
                    </Card>
                ))
            ) : (
                 <p className="bg-white text-gray-700 p-4 rounded-lg text-center shadow">No hay pedidos disponibles cerca de ti.</p>
            )}
        </>
    )

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#3D0000] to-[#2A0000] text-white">
            <header className="p-4 md:px-8 flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-wider">vrtelolleva Driver</h1>
                <button onClick={onLogout} className="p-2">
                    <Menu size={28} />
                </button>
            </header>
            <main className="p-4 md:p-8">
                 <div className="bg-white text-gray-900 p-4 rounded-lg flex justify-between items-center mb-6 shadow">
                    <div className="flex items-center">
                         <Power className={`mr-3 ${isOnline ? 'text-green-500 animate-pulse' : 'text-gray-500'}`} />
                         <span className="font-semibold text-lg">Estado: {isOnline ? 'En línea' : 'Desconectado'}</span>
                    </div>
                    <Button onClick={toggleOnlineStatus} variant={isOnline ? 'danger' : 'secondary'} className={!isOnline ? `bg-green-600 hover:bg-green-700` : ''}>
                        {isOnline ? 'Desconectarse' : 'Conectarse'}
                    </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <StatsCard 
                        title="Ganancias Hoy" 
                        value="$0.00" 
                        subtitle="0 entregas" 
                        icon={<DollarSign size={28} className="text-white"/>} 
                        iconBgColor="#27AE60" 
                        className="bg-gradient-to-br from-[#5A0000] to-[#400000]" 
                    />
                    <StatsCard 
                        title="Entregas Activas" 
                        value={currentOrder ? "1" : "0"} 
                        subtitle="En proceso" 
                        icon={<Bike size={28} className="text-white"/>} 
                        iconBgColor="#2F80ED" 
                        className="bg-gradient-to-br from-[#5A0000] to-[#400000]" 
                    />
                    <StatsCard 
                        title="Pedidos Disponibles" 
                        value={availableOrders.length.toString()}
                        subtitle="Listos para recoger" 
                        icon={<Clock size={28} className="text-white"/>} 
                        iconBgColor="#F2994A" 
                        className="bg-gradient-to-br from-[#5A0000] to-[#400000]" 
                    />
                    <StatsCard 
                        title="Total Entregas" 
                        value="45" 
                        subtitle="Historial completo" 
                        icon={<BarChart size={28} className="text-white"/>} 
                        iconBgColor="#9B51E0" 
                        className="bg-gradient-to-br from-[#5A0000] to-[#400000]" 
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                    {currentOrder ? (
                        <>
                            <div className="lg:col-span-2">
                                {renderCurrentOrder()}
                            </div>
                            <div className="lg:col-span-1">
                                {renderAvailableOrders()}
                            </div>
                        </>
                    ) : (
                        <div className="lg:col-span-3">
                            {renderAvailableOrders()}
                        </div>
                    )}
                </div>

            </main>
        </div>
    );
};

export default DeliveryDashboard;