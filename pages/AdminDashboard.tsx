

import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Profile, Order, OrderStatus, UserRole } from '../types';
import { APP_NAME, MOCK_USER_LOCATION, USER_ROLES, USER_ROLE_MAP, ORDER_STATUS_MAP } from '../constants';
import { authService } from '../services/authService';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { Users, Bike, Briefcase, Activity, MoreVertical, Search, Edit, UserCheck, UserX } from 'lucide-react';
import StatsCard from '../components/ui/StatsCard';
import DropdownMenu, { DropdownMenuItem } from '../components/ui/DropdownMenu';
import Badge from '../components/ui/Badge';
import ConfirmationModal from '../components/ui/ConfirmationModal';


interface AdminDashboardProps {
  user: Profile;
  onLogout: () => void;
}

const MOCK_LIVE_ORDERS: Order[] = [
    {
        id: 'order-123', client_id: 'client-1', business_id: 'business-1', delivery_person_id: 'delivery-1',
        items: [], total_price: 155, status: OrderStatus.ON_THE_WAY, 
        delivery_address: 'Av. de la Reforma 222, Juárez, 06600, CDMX',
        special_notes: 'Tocar en la puerta de madera, por favor.',
        delivery_location: { lat: 19.4350, lng: -99.1350 },
        business: { id: 'business-1', name: 'Taquería El Pastor', location: { lat: 19.4300, lng: -99.1300 }, category: 'Mexicana', delivery_fee: 30, delivery_time: '25-35 min', image: '', is_open: true, phone: '', address: '', email: '', rating: 4.8 },
        delivery_person: { id: 'delivery-1', name: 'Pedro R.', location: { lat: 19.4325, lng: -99.1325 }, is_online: true, vehicle: '', current_deliveries: 0, email: '', phone: '', rating: 0 },
        created_at: new Date().toISOString(),
    },
    {
        id: 'order-125', client_id: 'client-3', business_id: 'business-2',
        items: [], total_price: 225, status: OrderStatus.READY_FOR_PICKUP, 
        delivery_address: 'Calle de Madero 1, Centro Histórico, 06000, CDMX',
        special_notes: 'Sin salsa picante.',
        delivery_location: { lat: 19.4250, lng: -99.1450 },
        business: { id: 'business-2', name: 'Sushi Express', location: { lat: 19.4350, lng: -99.1400 }, category: 'Japonesa', delivery_fee: 0, delivery_time: '30-40 min', image: '', is_open: true, phone: '', address: '', email: '', rating: 4.6 },
        created_at: new Date().toISOString(),
    }
];

type AdminView = 'overview' | 'users' | 'businesses' | 'delivery';

const PlaceholderContent: React.FC<{ title: string }> = ({ title }) => (
    <div className="p-8">
        <h2 className="text-3xl font-bold mb-4">{title}</h2>
        <Card className="p-8 text-center bg-black/20 border border-white/10">
            <p className="text-gray-400">Funcionalidad para {title.toLowerCase()} en construcción.</p>
            <p className="text-gray-500 text-sm mt-2">Esta sección estará disponible próximamente.</p>
        </Card>
    </div>
);


const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onLogout }) => {
    const [liveOrders, setLiveOrders] = useState(MOCK_LIVE_ORDERS);
    const [currentView, setCurrentView] = useState<AdminView>('overview');
    
    // State for User Management
    const [users, setUsers] = useState<Profile[]>([]);
    const [usersLoading, setUsersLoading] = useState(true);
    const [usersError, setUsersError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL');
    const [modalState, setModalState] = useState<{ isOpen: boolean; user: Profile | null; action: 'activate' | 'deactivate' | null }>({ isOpen: false, user: null, action: null });


    // Effect for live order simulation
    useEffect(() => {
        const interval = setInterval(() => {
           setLiveOrders(prev => prev.map(o => {
               if(o.status === OrderStatus.ON_THE_WAY && o.delivery_person) {
                   const newLat = o.delivery_person.location.lat + (o.delivery_location.lat - o.delivery_person.location.lat) * 0.05;
                   const newLng = o.delivery_person.location.lng + (o.delivery_location.lng - o.delivery_person.location.lng) * 0.05;
                   return {...o, delivery_person: {...o.delivery_person, location: {lat: newLat, lng: newLng}}};
               }
               return o;
           }))
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    // Effect for fetching users when view changes to 'users'
    useEffect(() => {
        if (currentView === 'users') {
            const fetchUsers = async () => {
                try {
                    setUsersLoading(true);
                    setUsersError(null);
                    const fetchedUsers = await authService.getAllUsers();
                    setUsers(fetchedUsers);
                } catch (err: any) {
                    setUsersError(err.message);
                } finally {
                    setUsersLoading(false);
                }
            };
            fetchUsers();
        }
    }, [currentView]);

    const handleUpdateUser = async (userId: string, updates: Partial<Profile>) => {
        try {
            const updatedUser = await authService.updateUser(userId, updates);
            setUsers(prevUsers => prevUsers.map(u => u.id === userId ? { ...u, ...updatedUser } : u));
        } catch (err: any) {
            setUsersError(err.message);
        }
    };

    const openConfirmationModal = (user: Profile, action: 'activate' | 'deactivate') => {
        setModalState({ isOpen: true, user, action });
    };

    const handleConfirmAction = () => {
        if (modalState.user && modalState.action) {
            handleUpdateUser(modalState.user.id, { isActive: modalState.action === 'activate' });
        }
        setModalState({ isOpen: false, user: null, action: null });
    };

    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) || user.email.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
            return matchesSearch && matchesRole;
        });
    }, [users, searchQuery, roleFilter]);

    const navItems = [
        { id: 'overview', label: 'Vista General', icon: Activity },
        { id: 'users', label: 'Usuarios', icon: Users },
        { id: 'businesses', label: 'Negocios', icon: Briefcase },
        { id: 'delivery', label: 'Repartidores', icon: Bike }
    ];

    const UserTableRow: React.FC<{ user: Profile }> = ({ user }) => {
        const roleInfo = USER_ROLE_MAP[user.role] || { text: 'Desconocido', color: 'secondary' };
    
        return (
            <tr className="border-b border-white/10 last:border-b-0 hover:bg-white/5 transition-colors">
                <td className="p-4 align-top">
                    <div className="font-semibold">{user.name}</div>
                    <div className="text-sm text-gray-400">{user.email}</div>
                </td>
                <td className="p-4 align-top">
                    <Badge color={roleInfo.color}>{roleInfo.text}</Badge>
                </td>
                <td className="p-4 align-top">
                    <Badge color={user.isActive ? 'success' : 'danger'}>
                        {user.isActive ? 'Activo' : 'Inactivo'}
                    </Badge>
                </td>
                <td className="p-4 align-top text-right">
                    <DropdownMenu trigger={<Button variant="secondary" className="!p-2"><MoreVertical size={18} /></Button>}>
                        <div className="px-4 py-2 text-xs text-gray-400">Cambiar Rol a:</div>
                        {USER_ROLES.filter(r => r.id !== user.role).map(role => (
                            <DropdownMenuItem key={role.id} onClick={() => handleUpdateUser(user.id, { role: role.id })}>
                                <div className="flex items-center"><Edit className="w-4 h-4 mr-2" /> {role.name}</div>
                            </DropdownMenuItem>
                        ))}
                        <div className="border-t my-1 border-gray-700"></div>
                        {user.isActive ? (
                            <DropdownMenuItem onClick={() => openConfirmationModal(user, 'deactivate')}>
                                <div className="flex items-center text-red-400"><UserX className="w-4 h-4 mr-2" /> Desactivar Usuario</div>
                            </DropdownMenuItem>
                        ) : (
                            <DropdownMenuItem onClick={() => openConfirmationModal(user, 'activate')}>
                                <div className="flex items-center text-green-400"><UserCheck className="w-4 h-4 mr-2" /> Activar Usuario</div>
                            </DropdownMenuItem>
                        )}
                    </DropdownMenu>
                </td>
            </tr>
        );
    };

    const renderUserManagement = () => (
        <div className="p-4 md:p-8">
            <h2 className="text-3xl font-bold mb-6">Gestión de Usuarios</h2>
            <Card className="p-4 mb-6 bg-black/20 border border-white/10">
                <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-grow w-full md:w-auto">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full p-2 pl-10 border rounded-lg bg-transparent border-white/20 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap justify-center">
                        <span className="text-sm font-semibold hidden sm:inline">Rol:</span>
                        <Button variant={roleFilter === 'ALL' ? 'primary' : 'secondary'} onClick={() => setRoleFilter('ALL')} className="!px-3 !py-1 text-sm">Todos</Button>
                        {USER_ROLES.map(role => (
                            <Button key={role.id} variant={roleFilter === role.id ? 'primary' : 'secondary'} onClick={() => setRoleFilter(role.id)} className="!px-3 !py-1 text-sm">{role.name}</Button>
                        ))}
                    </div>
                </div>
            </Card>

            <Card className="overflow-x-auto bg-black/20 border border-white/10">
                <table className="w-full min-w-[600px] text-left">
                    <thead className="border-b border-white/10">
                        <tr>
                            <th className="p-4 font-semibold">Nombre</th>
                            <th className="p-4 font-semibold">Rol</th>
                            <th className="p-4 font-semibold">Estado</th>
                            <th className="p-4 font-semibold text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {usersLoading ? (
                            <tr><td colSpan={4} className="text-center p-8 text-gray-400">Cargando usuarios...</td></tr>
                        ) : usersError ? (
                            <tr><td colSpan={4} className="text-center p-8 text-red-400">{usersError}</td></tr>
                        ) : filteredUsers.length > 0 ? (
                            filteredUsers.map(user => <UserTableRow key={user.id} user={user} />)
                        ) : (
                            <tr><td colSpan={4} className="text-center p-8 text-gray-400">No se encontraron usuarios.</td></tr>
                        )}
                    </tbody>
                </table>
            </Card>
            <ConfirmationModal
                isOpen={modalState.isOpen}
                onClose={() => setModalState({ isOpen: false, user: null, action: null })}
                onConfirm={handleConfirmAction}
                title={`${modalState.action === 'activate' ? 'Activar' : 'Desactivar'} Usuario`}
                message={`¿Estás seguro de que quieres ${modalState.action === 'activate' ? 'activar' : 'desactivar'} la cuenta de ${modalState.user?.name}?`}
                confirmText={modalState.action === 'activate' ? 'Sí, activar' : 'Sí, desactivar'}
            />
        </div>
    );

    const renderContent = () => {
        switch (currentView) {
            case 'users':
                return renderUserManagement();
            case 'businesses':
                return <PlaceholderContent title="Gestión de Negocios" />;
            case 'delivery':
                return <PlaceholderContent title="Gestión de Repartidores" />;
            case 'overview':
            default:
                return (
                    <>
                        <header className="p-4 flex-shrink-0">
                             <h2 className="text-3xl font-bold">Vista Global en Tiempo Real</h2>
                        </header>
                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 flex-shrink-0">
                            <StatsCard title="Pedidos Activos" value={liveOrders.length.toString()} icon={<Activity className="text-white" />} iconBgColor="#2F80ED" className="bg-black/20" />
                            <StatsCard title="Clientes en Línea" value="1,204" icon={<Users className="text-white" />} iconBgColor="#27AE60" className="bg-black/20" />
                            <StatsCard title="Negocios Abiertos" value="23" icon={<Briefcase className="text-white" />} iconBgColor="#F2994A" className="bg-black/20" />
                            <StatsCard title="Repartidores Activos" value="47" icon={<Bike className="text-white" />} iconBgColor="#9B51E0" className="bg-black/20" />
                        </div>
                        <div className="flex-grow p-4 min-h-0">
                            <Card className="w-full h-full overflow-hidden bg-transparent p-0">
                                <MapContainer center={[MOCK_USER_LOCATION.lat, MOCK_USER_LOCATION.lng]} zoom={12} scrollWheelZoom={true} className="w-full h-full">
                                   <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>' />
                                    {liveOrders.flatMap(order => [
                                        order.business && (
                                            <Marker key={`${order.id}-business`} position={[order.business.location.lat, order.business.location.lng]} icon={new L.Icon({iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', shadowSize: [41, 41]})}>
                                                <Popup>
                                                    <div className="text-sm">
                                                        <p className="font-bold text-base">{order.business.name}</p>
                                                        <p>Negocio</p>
                                                    </div>
                                                </Popup>
                                            </Marker>
                                        ),
                                        order.delivery_person && (
                                            <Marker key={`${order.id}-delivery`} position={[order.delivery_person.location.lat, order.delivery_person.location.lng]} icon={new L.Icon({iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png', shadowSize: [41, 41]})}>
                                                <Popup>
                                                    <div className="text-sm text-gray-800">
                                                        <p className="font-bold text-base">{order.delivery_person.name}</p>
                                                        <p className="text-xs text-gray-600 mb-1">Repartidor</p>
                                                        <hr className="my-1" />
                                                        <p>
                                                            <strong>Estado: </strong>
                                                            <span className={`font-semibold ${order.delivery_person.is_online ? 'text-green-600' : 'text-gray-500'}`}>
                                                                {order.status === OrderStatus.ON_THE_WAY ? 'En Entrega' : 'Asignado'}
                                                            </span>
                                                        </p>
                                                    </div>
                                                </Popup>
                                            </Marker>
                                        ),
                                        <Marker key={`${order.id}-client`} position={[order.delivery_location.lat, order.delivery_location.lng]} icon={new L.Icon({iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png', iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png', shadowSize: [41, 41]})}>
                                            <Popup>
                                                <div className="text-sm text-gray-800" style={{ minWidth: '180px' }}>
                                                    <p className="font-bold text-base mb-1">Pedido #{order.id.slice(-6)}</p>
                                                    <p><strong>Cliente:</strong> #{order.client_id.slice(-4)}</p>
                                                    <p><strong>Estado:</strong> <span className="font-semibold">{ORDER_STATUS_MAP[order.status].text}</span></p>
                                                    <hr className="my-1" />
                                                    <p><strong>Dirección:</strong> {order.delivery_address}</p>
                                                    {order.special_notes && <p className="mt-1"><strong>Notas:</strong> <span className="italic">"{order.special_notes}"</span></p>}
                                                </div>
                                            </Popup>
                                        </Marker>
                                    ].filter(Boolean))}
                                </MapContainer>
                            </Card>
                        </div>
                    </>
                );
        }
    }
    
    return (
        <div className="flex h-screen bg-[#081826] text-white">
            <aside className="w-64 bg-[#0B2235] shadow-lg p-4 flex flex-col flex-shrink-0">
                <h1 className="text-2xl font-bold text-blue-400 mb-8">{APP_NAME} Admin</h1>
                <nav className="flex-grow">
                    <ul>
                       {navItems.map(item => (
                            <li key={item.id} className="mb-2">
                                <button
                                    onClick={() => setCurrentView(item.id as AdminView)}
                                    className={`w-full flex items-center p-3 rounded-lg text-left transition-colors duration-200 ${
                                        currentView === item.id
                                            ? 'bg-blue-500/20 text-blue-300 font-semibold'
                                            : 'hover:bg-white/10'
                                    }`}
                                >
                                    <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                                    <span>{item.label}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </nav>
                <div>
                     <p className="text-sm text-gray-400">Hola, {user.name}</p>
                     <Button onClick={onLogout} variant="secondary" className="w-full mt-2">Cerrar Sesión</Button>
                </div>
            </aside>
            <main className="flex-1 flex flex-col overflow-y-auto">
                {renderContent()}
            </main>
        </div>
    );
};

export default AdminDashboard;