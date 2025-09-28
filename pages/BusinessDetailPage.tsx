import React from 'react';
import { Business, Product } from '../types';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import ProductCard from '../components/client/ProductCard';
import StarRating from '../components/ui/StarRating';
import { ChevronLeft, MapPin, Phone, Star, Clock as ClockIcon } from 'lucide-react';

interface BusinessDetailPageProps {
  business: Business;
  onAddToCart: (product: Product) => void;
  onGoBack: () => void;
}

const MOCK_REVIEWS = [
    { id: 1, author: 'Juan P.', rating: 5, comment: '¡La comida es excelente y llegó súper rápido! Totalmente recomendado.' },
    { id: 2, author: 'Maria G.', rating: 4, comment: 'Muy buen sabor, aunque la porción podría ser un poco más grande.' },
    { id: 3, author: 'Carlos S.', rating: 5, comment: 'El mejor lugar de la zona, siempre pido de aquí.' },
];

const BusinessDetailPage: React.FC<BusinessDetailPageProps> = ({ business, onAddToCart, onGoBack }) => {
  return (
    <div className="animate-fade-in bg-[#1A0129] min-h-full">
        <div className="container mx-auto p-4 md:p-8">
            <Button onClick={onGoBack} variant="secondary" className="mb-6 flex items-center">
                <ChevronLeft className="w-5 h-5 mr-2" />
                Volver a Restaurantes
            </Button>

            {/* Business Header */}
            <Card className="mb-8 overflow-hidden bg-transparent p-0 border-none">
                <div className="relative">
                    <img src={`https://picsum.photos/seed/${business.id}/1200/400`} alt={business.name} className="w-full h-64 object-cover rounded-t-lg"/>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 p-6">
                        <h1 className="text-4xl font-extrabold text-white">{business.name}</h1>
                        <p className="text-lg text-gray-200">{business.category}</p>
                    </div>
                </div>
                <div className="p-4 bg-white/5 flex flex-wrap items-center justify-around text-sm rounded-b-lg">
                    <div className="flex items-center m-2"><Star className="w-5 h-5 text-yellow-400 fill-yellow-400 mr-2" /> <span className="font-bold">{business.rating}</span> <span className="text-gray-400 ml-1"> (100+)</span></div>
                    <div className="flex items-center m-2"><ClockIcon className="w-5 h-5 text-gray-300 mr-2" /> <span>{business.delivery_time}</span></div>
                    <div className="flex items-center m-2 font-semibold"><span>Envío: ${business.delivery_fee.toFixed(2)}</span></div>
                     {!business.is_open && <div className="m-2 px-3 py-1 bg-red-600 text-white rounded-full font-bold text-xs">CERRADO</div>}
                </div>
            </Card>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Products Column */}
                <div className="lg:col-span-2">
                    <h2 className="text-3xl font-bold mb-6">Menú</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {business.products && business.products.length > 0 ? (
                            business.products.map(product => (
                                <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} businessName={business.name} />
                            ))
                        ) : (
                            <p>Este negocio no tiene productos disponibles por el momento.</p>
                        )}
                    </div>
                </div>

                {/* Info & Reviews Column */}
                <div className="lg:col-span-1 space-y-8">
                    <Card className="p-6 bg-white/10 border border-white/20">
                         <h3 className="text-2xl font-bold mb-4">Información</h3>
                         <ul className="space-y-3 text-gray-300">
                             <li className="flex items-start"><MapPin className="w-5 h-5 mr-3 mt-1 flex-shrink-0 text-purple-400"/> <span>{business.address}</span></li>
                             <li className="flex items-center"><Phone className="w-5 h-5 mr-3 flex-shrink-0 text-purple-400"/> <span>{business.phone}</span></li>
                             <li className="flex items-start"><ClockIcon className="w-5 h-5 mr-3 mt-1 flex-shrink-0 text-purple-400"/> <span>L-S: 11:00-22:00<br/>D: 12:00-20:00</span></li>
                         </ul>
                    </Card>

                     <Card className="p-6 bg-white/10 border border-white/20">
                         <h3 className="text-2xl font-bold mb-4">Opiniones</h3>
                         <ul className="space-y-4">
                             {MOCK_REVIEWS.map(review => (
                                 <li key={review.id} className="border-b border-white/10 pb-3 last:border-b-0">
                                     <div className="flex justify-between items-center mb-1">
                                         <p className="font-semibold">{review.author}</p>
                                         <StarRating rating={review.rating} size={16} />
                                     </div>
                                     <p className="text-gray-400 text-sm">{review.comment}</p>
                                 </li>
                             ))}
                         </ul>
                    </Card>
                </div>
            </div>
        </div>
    </div>
  );
};

export default BusinessDetailPage;