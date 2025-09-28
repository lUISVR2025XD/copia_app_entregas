
import React, { useState, useMemo } from 'react';
import { Order, OrderStatus, UserRole, Business } from '../types';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { ORDER_STATUS_MAP } from '../constants';
import { ChevronLeft, RefreshCw, Search, Eye, ShoppingBag, Star, ThumbsUp } from 'lucide-react';
import OrderDetailsModal from '../components/client/OrderDetailsModal';
import RatingModal from '../components/client/RatingModal';
import { orderService } from '../services/orderService';
import { notificationService } from '../services/notificationService';


interface MyOrdersPageProps {
    orders: Order[];
    onTrackOrder: (order: Order) => void;
    onBackToShopping: () => void;
    onUpdateBusinessRating: (businessId: string, newRating: number) => void;
    onUpdateOrder: (updatedOrder: Order) => void;
}

const MyOrdersPage: React.FC<MyOrdersPageProps> = ({ orders, onTrackOrder, onBackToShopping, onUpdateBusinessRating, onUpdateOrder }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [orderToRate, setOrderToRate] = useState<Order | null>(null);

    const filteredOrders = useMemo(() => {
        if (!searchQuery) {
            return orders;
        }
        const lowercasedQuery = searchQuery.toLowerCase();
        return orders.filter(order => {
            const businessNameMatch = order.business?.name.toLowerCase().includes(lowercasedQuery);
            const statusMatch = ORDER_STATUS_MAP[order.status].text.toLowerCase().includes(lowercasedQuery);
            return businessNameMatch || statusMatch;
        });
    }, [orders, searchQuery]);

    const isTrackable = (status: OrderStatus) => {
        return [
            OrderStatus.ACCEPTED,
            OrderStatus.IN_PREPARATION,
            OrderStatus.READY_FOR_PICKUP,
            OrderStatus.ON_THE_WAY
        ].includes(status);
    };

    const handleRateOrderClick = (order: Order) => {
        setOrderToRate(order);
    };

    const handleSubmitRating = async (ratings: { business: number; delivery: number }) => {
        if (!orderToRate) return;

        // Simulate updating business rating
        onUpdateBusinessRating(orderToRate.business_id, ratings.business);
        
        // NOTE: Delivery person rating update is not implemented as there's no central store for them in the client view.
        
        // Mark order as rated in the backend
        const updatedOrder = await orderService.updateOrder(orderToRate.id, { is_rated: true });
        
        if(updatedOrder) {
            onUpdateOrder(updatedOrder);
        }

        notificationService.sendNotification({
            id: `rate-success-${Date.now()}`,
            role: UserRole.CLIENT,
            title: '¡Gracias por tu opinión!',
            message: 'Tu calificación ha sido registrada.',
            type: 'success',
            icon: ThumbsUp,
        });

        setOrderToRate(null); // Close modal
    };


    return (
        <div className="container mx-auto p-4 md:p-8 animate-fade-in">
            <Button onClick={onBackToShopping} variant="secondary" className="mb-6 flex items-center">
                <ChevronLeft className="w-5 h-5 mr-2" />
                Volver a Restaurantes
            </Button>

            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <h2 className="text-3xl font-bold">Mis Pedidos</h2>
                <div className="relative w-full md:max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por negocio o estado..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full p-2 pl-10 border rounded-lg bg-white/10 border-white/20 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                </div>
            </div>

            {filteredOrders.length > 0 ? (
                <div className="space-y-6">
                    {filteredOrders.map(order => {
                        const statusInfo = ORDER_STATUS_MAP[order.status];
                        return (
                            <Card key={order.id} className="overflow-hidden bg-white/10 border border-white/20 transition-shadow hover:shadow-lg flex flex-col sm:flex-row">
                                {order.business?.image && (
                                    <img src={order.business.image} alt={order.business.name} className="w-full sm:w-40 h-40 sm:h-auto object-cover" />
                                )}
                                <div className="p-4 flex flex-col flex-grow">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3 className="text-xl font-bold">{order.business?.name}</h3>
                                            <p className="text-sm text-gray-400">
                                                {new Date(order.created_at).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
                                            </p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-white text-xs font-semibold ${statusInfo.color}`}>{statusInfo.text}</span>
                                    </div>

                                    <div className="flex justify-between items-baseline border-t border-white/10 pt-2 mt-2">
                                        <span className="text-sm text-gray-400">ID: #{order.id.slice(-6)}</span>
                                        <span className="text-lg font-bold">Total: ${order.total_price.toFixed(2)}</span>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-white/10 flex flex-col sm:flex-row gap-2 sm:justify-end">
                                        {isTrackable(order.status) ? (
                                            <Button onClick={() => onTrackOrder(order)} className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700">
                                                Seguir Pedido
                                            </Button>
                                        ) : order.status === OrderStatus.DELIVERED && !order.is_rated ? (
                                             <Button onClick={() => handleRateOrderClick(order)} className="w-full sm:w-auto !bg-yellow-500 hover:!bg-yellow-600 !text-black flex items-center justify-center">
                                                <Star className="w-4 h-4 mr-2" />
                                                Calificar Pedido
                                            </Button>
                                        ) : (
                                            <Button variant="secondary" className="w-full sm:w-auto flex items-center justify-center" onClick={() => setSelectedOrder(order)}>
                                                <Eye className="w-4 h-4 mr-2" />
                                                Ver Detalles
                                            </Button>
                                        )}
                                        <Button variant="secondary" className="w-full sm:w-auto flex items-center justify-center">
                                            <RefreshCw className="w-4 h-4 mr-2" />
                                            Volver a Pedir
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-16 bg-white/5 rounded-lg">
                    <ShoppingBag className="mx-auto h-16 w-16 text-gray-400" />
                    <h3 className="mt-4 text-2xl font-semibold">No se encontraron pedidos</h3>
                    <p className="mt-2 text-gray-400">
                        {searchQuery ? "Intenta con una búsqueda diferente." : "No has realizado ningún pedido todavía."}
                    </p>
                </div>
            )}
             <OrderDetailsModal
                isOpen={!!selectedOrder}
                order={selectedOrder}
                onClose={() => setSelectedOrder(null)}
            />
            <RatingModal
                isOpen={!!orderToRate}
                order={orderToRate}
                onClose={() => setOrderToRate(null)}
                onSubmit={handleSubmitRating}
            />
        </div>
    );
};

export default MyOrdersPage;