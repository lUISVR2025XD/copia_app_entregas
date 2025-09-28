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
        <Card className="p-8 text-center bg-white border border-gray-200 shadow">
            <p className="text-gray-700">Funcionalidad para {title.toLowerCase()} en construcción.</p>
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
            <tr className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors">
                <td className="p-4 align-top">
                    <div className="font-semibold text-gray-900">{user.name}</div>
                    <div className="text-sm text-gray-600">{user.email}</div>
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
                    <DropdownMenu trigger={<Button variant="secondary" className="!p-2 !bg-gray-200 !text-gray-800 hover:!bg-gray-300"><MoreVertical size={18} /></Button>}>
                        <div className="px-4 py-2 text-xs text-gray-400">Cambiar Rol a:</div>
                        {USER_ROLES.filter(r => r.id !== user.role).map(role => (
                            <DropdownMenuItem key={role.id} onClick={() => handleUpdateUser(user.id, { role: role.id })}>
                                <div className="flex items-center"><Edit className="w-4 h-4 mr-2" /> {role.name}</div>
                            </DropdownMenuItem>
                        ))}
                        <div className="border-t my-1 border-gray-200"></div>
                        {user.isActive ? (
                            <DropdownMenuItem onClick={() => openConfirmationModal(user, 'deactivate')}>
                                <div className="flex items-center text-red-500"><UserX className="w-4 h-4 mr-2" /> Desactivar Usuario</div>
                            </DropdownMenuItem>
                        ) : (
                            <DropdownMenuItem onClick={() => openConfirmationModal(user, 'activate')}>
                                <div className="flex items-center text-green-500"><UserCheck className="w-4 h-4 mr-2" /> Activar Usuario</div>
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
            <Card className="p-4 bg-white border border-gray-200 shadow mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-grow">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o correo..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full p-2 pl-10 border rounded-md bg-gray-50 border-gray-300 text-gray-900 focus:ring-purple-500 focus:border-purple-500"
                        />
                    </div>
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value as UserRole | 'ALL')}
                        className="p-2 border rounded-md bg-gray-50 border-gray-300 text-gray-900 focus:ring-purple-500 focus:border-purple-500"
                    >
                        <option value="ALL">Todos los Roles</option>
                        {USER_ROLES.map(role => (
                            <option key={role.id} value={role.id}>{role.name}</option>
                        ))}
                    </select>
                </div>
            </Card>

            <Card className="overflow-x-auto bg-white border border-gray-200 shadow">
                {usersLoading ? (
                    <p className="p-8 text-center text-gray-600">Cargando usuarios...</p>
                ) : usersError ? (
                    <p className="p-8 text-center text-red-600">Error: {usersError}</p>
                ) : (
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="p-4">Usuario</th>
                                <th scope="col" className="p-4">Rol</th>
                                <th scope="col" className="p-4">Estado</th>
                                <th scope="col" className="p-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map(user => <UserTableRow key={user.id} user={user} />)}
                        </tbody>
                    </table>
                )}
            </Card>
        </div>
    );

    const renderContent = () => {
        switch (currentView) {
            case 'overview':
                 return (
                    <div className="p-4 md:p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <StatsCard title="Total Usuarios" value={users.length.toString()} icon={<Users size={28} className="text-white"/>} iconBgColor="#3F7FBF" className="bg-gradient-to-br from-[#1A0129] to-[#2C0054]" />
                            <StatsCard title="Total Negocios" value="12" icon={<Briefcase size={28} className="text-white"/>} iconBgColor="#F2994A" className="bg-gradient-to-br from-[#1A0129] to-[#2C0054]" />
                            <StatsCard title="Total Repartidores" value="8" icon={<Bike size={28} className="text-white"/>} iconBgColor="#00A88B" className="bg-gradient-to-br from-[#1A0129] to-[#2C0054]" />
                            <StatsCard title="Pedidos en Curso" value={liveOrders.length.toString()} icon={<Activity size={28} className="text-white"/>} iconBgColor="#9B51E0" className="bg-gradient-to-br from-[#1A0129] to-[#2C0054]" />
                        </div>
                        <h2 className="text-3xl font-bold mb-4">Mapa de Actividad en Vivo</h2>
                        <Card className="h-[600px] overflow-hidden bg-transparent border-none p-0">
                            <MapContainer center={[MOCK_USER_LOCATION.lat, MOCK_USER_LOCATION.lng]} zoom={13} scrollWheelZoom={false} className="h-full w-full">
                                <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'/>
                                {liveOrders.map(order => (
                                    <React.Fragment key={order.id}>
                                        {order.business?.location && <Marker position={[order.business.location.lat, order.business.location.lng]}><Popup>{order.business.name} (Negocio)</Popup></Marker>}
                                        {order.delivery_person?.location && <Marker position={[order.delivery_person.location.lat, order.delivery_person.location.lng]}><Popup>{order.delivery_person.name} (Repartidor)</Popup></Marker>}
                                    </React.Fragment>
                                ))}
                            </MapContainer>
                        </Card>
                    </div>
                );
            case 'users':
                return renderUserManagement();
            case 'businesses':
                return <PlaceholderContent title="Gestión de Negocios" />;
            case 'delivery':
                return <PlaceholderContent title="Gestión de Repartidores" />;
            default:
                return null;
        }
    }

    return (
        <div className="min-h-screen bg-gray-100 flex">
             <aside className="w-64 bg-[#1A0129] text-white flex flex-col">
                <div className="p-6 border-b border-white/10">
                    <h1 className="text-2xl font-bold">{APP_NAME}</h1>
                    <span className="text-sm text-purple-300">Panel de Admin</span>
                </div>
                <nav className="flex-grow p-4">
                    {navItems.map(item => {
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setCurrentView(item.id as AdminView)}
                                className={`w-full flex items-center p-3 my-1 rounded-lg text-left transition-colors ${
                                currentView === item.id ? 'bg-purple-800' : 'hover:bg-purple-900/50'
                                }`}
                            >
                                <Icon className="w-5 h-5 mr-3" />
                                {item.label}
                            </button>
                        );
                    })}
                </nav>
                <div className="p-4 border-t border-white/10">
                    <p className="text-sm">Iniciaste sesión como</p>
                    <p className="font-semibold truncate">{user.name}</p>
                    <Button onClick={onLogout} variant="secondary" className="w-full mt-4">Cerrar Sesión</Button>
                </div>
            </aside>
            <main className="flex-1 overflow-y-auto">
                {renderContent()}
            </main>
            <ConfirmationModal
                isOpen={modalState.isOpen}
                onClose={() => setModalState({ isOpen: false, user: null, action: null })}
                onConfirm={handleConfirmAction}
                title={`Confirmar ${modalState.action === 'activate' ? 'Activación' : 'Desactivación'}`}
                message={`¿Estás seguro de que quieres ${modalState.action === 'activate' ? 'activar' : 'desactivar'} a ${modalState.user?.name}?`}
                confirmText={`Sí, ${modalState.action === 'activate' ? 'Activar' : 'Desactivar'}`}
            />
        </div>
    );
};

export default AdminDashboard;