import React, { useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { CartItem, Business, Location } from '../../types';
import Button from '../ui/Button';
import { X, Plus, Minus, Trash2, MapPin } from 'lucide-react';

interface ShoppingCartProps {
    isOpen: boolean;
    onClose: () => void;
    cart: CartItem[];
    business: Business | null;
    userLocation: Location;
    onUpdateQuantity: (productId: string, newQuantity: number) => void;
    onRemoveItem: (productId: string) => void;
    onPlaceOrder: (details: { location: Location; notes: string }) => void;
}

const LocationPicker: React.FC<{ initialCenter: Location; onLocationChange: (location: Location) => void }> = ({ initialCenter, onLocationChange }) => {
    const [markerPosition, setMarkerPosition] = useState<Location>(initialCenter);

    const MapEvents = () => {
        useMapEvents({
            click(e) {
                const newPos = { lat: e.latlng.lat, lng: e.latlng.lng };
                setMarkerPosition(newPos);
                onLocationChange(newPos);
            },
        });
        return null;
    };
    
    // Fix for default marker icon issue
    const defaultIcon = new L.Icon({
        iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
        iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
        shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png', shadowSize: [41, 41]
    });

    return (
        <div className="h-64 w-full rounded-lg overflow-hidden z-0">
             <MapContainer center={[initialCenter.lat, initialCenter.lng]} zoom={15} className="h-full w-full">
                <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>' />
                <Marker position={[markerPosition.lat, markerPosition.lng]} icon={defaultIcon} />
                <MapEvents />
            </MapContainer>
        </div>
    );
}


const ShoppingCart: React.FC<ShoppingCartProps> = ({ isOpen, onClose, cart, business, userLocation, onUpdateQuantity, onRemoveItem, onPlaceOrder }) => {
    const [notes, setNotes] = useState('');
    const [deliveryLocation, setDeliveryLocation] = useState<Location>(userLocation);

    const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0), [cart]);
    const deliveryFee = business?.delivery_fee ?? 0;
    const total = subtotal + deliveryFee;

    const handlePlaceOrderClick = () => {
        if (cart.length === 0) {
            alert("Tu carrito está vacío.");
            return;
        }
        onPlaceOrder({ location: deliveryLocation, notes });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-end z-50">
            <div className="bg-[#1A0129] w-full max-w-lg h-full shadow-2xl flex flex-col transform transition-transform duration-300 translate-x-0 border-l-2 border-purple-800">
                <div className="flex justify-between items-center p-4 border-b border-white/10">
                    <h2 className="text-2xl font-bold">Tu Pedido</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10"><X /></button>
                </div>

                {cart.length > 0 && business ? (
                    <div className="p-4 overflow-y-auto flex-grow">
                        <h3 className="font-semibold mb-2 text-lg">De: <span className="text-purple-400">{business.name}</span></h3>
                        <ul className="divide-y divide-white/10">
                            {cart.map(item => (
                                <li key={item.product.id} className="py-3 flex items-center">
                                    <div className="flex-grow">
                                        <p className="font-semibold">{item.product.name}</p>
                                        <p className="text-sm text-gray-400">${item.product.price.toFixed(2)}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)} className="p-1 rounded-full bg-white/10"><Minus size={16}/></button>
                                        <span>{item.quantity}</span>
                                        <button onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)} className="p-1 rounded-full bg-white/10"><Plus size={16}/></button>
                                    </div>
                                    <span className="w-20 text-right font-semibold">${(item.product.price * item.quantity).toFixed(2)}</span>
                                    <button onClick={() => onRemoveItem(item.product.id)} className="ml-2 text-red-500 hover:text-red-400"><Trash2 size={18}/></button>
                                </li>
                            ))}
                        </ul>
                        <div className="mt-6">
                            <h4 className="font-semibold mb-2 flex items-center"><MapPin className="mr-2 text-purple-400"/> Dirección de Entrega</h4>
                            <p className="text-sm text-gray-400 mb-2">Haz clic en el mapa para ajustar tu ubicación de entrega.</p>
                            <LocationPicker initialCenter={userLocation} onLocationChange={setDeliveryLocation} />
                        </div>
                        <div className="mt-6">
                            <h4 className="font-semibold mb-2">Notas Especiales</h4>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Ej: sin salsa, con queso extra, tocar en puerta de madera, etc."
                                className="w-full p-2 border rounded-md bg-transparent border-white/20 focus:ring-purple-500 focus:border-purple-500"
                                rows={3}
                            ></textarea>
                        </div>
                    </div>
                ) : (
                    <div className="p-8 text-center flex-grow flex flex-col justify-center items-center">
                        <p className="text-gray-400">Tu carrito está vacío.</p>
                        <p className="text-gray-500">¡Agrega productos para continuar!</p>
                    </div>
                )}

                <div className="p-4 border-t border-white/10 mt-auto bg-[#2C0054]">
                    <div className="space-y-2 text-lg mb-4">
                        <div className="flex justify-between"><span>Subtotal:</span> <span>${subtotal.toFixed(2)}</span></div>
                        <div className="flex justify-between"><span>Envío:</span> <span>${deliveryFee.toFixed(2)}</span></div>
                        <div className="flex justify-between font-bold text-xl"><span>Total:</span> <span>${total.toFixed(2)}</span></div>
                    </div>
                    <Button onClick={handlePlaceOrderClick} className="w-full text-lg bg-purple-600 hover:bg-purple-700" disabled={cart.length === 0}>
                        Realizar Pedido
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ShoppingCart;