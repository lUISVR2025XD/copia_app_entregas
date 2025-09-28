

import React, { useState, useEffect } from 'react';
import { Order, OrderStatus } from '../../types';
import { Clock, User, FileText, Check, X, Package, Bike, MapPin } from 'lucide-react';
import Button from '../ui/Button';
import { ORDER_STATUS_MAP } from '../../constants';

interface BusinessOrderCardProps {
  order: Order;
  onAccept: (order: Order) => void;
  onReject: (orderId: string) => void;
  onReady: (orderId: string) => void;
}

const BusinessOrderCard: React.FC<BusinessOrderCardProps> = ({ order, onAccept, onReject, onReady }) => {
    const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds

    useEffect(() => {
        if (order.status !== OrderStatus.PENDING) return;

        const timeSinceCreation = Math.floor((Date.now() - new Date(order.created_at).getTime()) / 1000);
        const initialTimeLeft = 300 - timeSinceCreation;
        
        if (initialTimeLeft <= 0) {
            setTimeLeft(0);
            return;
        }

        setTimeLeft(initialTimeLeft);

        const timer = setInterval(() => {
            setTimeLeft(prevTime => {
                if (prevTime <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prevTime - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [order.created_at, order.status]);

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    };

    const isUrgent = timeLeft < 60 && order.status === OrderStatus.PENDING;

    return (
        <div className={`p-4 rounded-lg border ${isUrgent ? 'bg-red-900/30 border-red-500/50' : 'bg-gray-900/50 border-teal-500/20'}`}>
            <div className="flex justify-between items-center mb-3">
                <h4 className="font-bold text-lg">Pedido #{order.id.slice(-6)}</h4>
                {order.status === OrderStatus.PENDING && (
                    <div className={`flex items-center font-bold px-2 py-1 rounded text-sm ${isUrgent ? 'text-red-200' : 'text-yellow-300'}`}>
                        <Clock className="w-4 h-4 mr-1" />
                        <span>{formatTime(timeLeft)}</span>
                    </div>
                )}
            </div>

            <div className="space-y-2 text-sm text-gray-300 mb-4">
                <div className="flex items-center"><User className="w-4 h-4 mr-2 text-teal-400" /> Cliente: {order.client?.name || 'N/A'}</div>
                <div className="flex items-start"><MapPin className="w-4 h-4 mr-2 mt-0.5 text-teal-400 flex-shrink-0" /> Dirección: {order.delivery_address}</div>
                {order.special_notes && <div className="flex items-start"><FileText className="w-4 h-4 mr-2 mt-0.5 text-teal-400 flex-shrink-0" /> Notas: <span className="italic ml-1">"{order.special_notes}"</span></div>}
            </div>

            <ul className="text-sm border-t border-b border-white/10 py-2 my-3 space-y-1">
                {order.items.map(item => (
                    <li key={item.product.id} className="flex justify-between">
                        <span>{item.quantity}x {item.product.name}</span>
                        <span className="font-medium">${(item.quantity * item.product.price).toFixed(2)}</span>
                    </li>
                ))}
            </ul>
             <div className="text-right font-bold text-lg mb-4">Total: ${order.total_price.toFixed(2)}</div>

            <div>
                {order.status === OrderStatus.PENDING && (
                    <div className="flex gap-2 mt-2">
                        <Button onClick={() => onAccept(order)} className="bg-green-600 hover:bg-green-700 w-full flex items-center justify-center">
                            <Check className="w-5 h-5 mr-1"/> Aceptar
                        </Button>
                        <Button onClick={() => onReject(order.id)} variant="danger" className="w-full flex items-center justify-center">
                            <X className="w-5 h-5 mr-1"/> Rechazar
                        </Button>
                    </div>
                )}
                {order.status === OrderStatus.IN_PREPARATION && (
                    <Button onClick={() => onReady(order.id)} className="w-full mt-2 bg-purple-600 hover:bg-purple-700 flex items-center justify-center">
                        <Package className="w-5 h-5 mr-2" /> Listo para Recoger
                    </Button>
                )}
                 {(order.status === OrderStatus.READY_FOR_PICKUP || order.status === OrderStatus.ON_THE_WAY) && (
                     <div className="mt-2 text-center p-2 rounded-md bg-black/20 font-semibold">
                       <p className={`flex items-center justify-center ${
                           order.status === OrderStatus.READY_FOR_PICKUP ? 'text-purple-300' : 'text-cyan-300'
                       }`}>
                           {order.status === OrderStatus.READY_FOR_PICKUP ? <Package className="w-4 h-4 mr-2" /> : <Bike className="w-4 h-4 mr-2" />}
                           {ORDER_STATUS_MAP[order.status].text}
                       </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BusinessOrderCard;