import React, { useState } from 'react';
import { Reservation } from '../types';
import { Search, Filter, MoreHorizontal, Bus, Calendar, DollarSign, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

interface DashboardProps {
  reservations: Reservation[];
  onStatusChange: (id: string, newStatus: Reservation['status']) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ reservations, onStatusChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [platformFilter, setPlatformFilter] = useState<string>('all');

  // Filter Logic
  const filteredReservations = reservations.filter((res) => {
    const matchesSearch = 
      res.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      res.reservation_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      res.platform.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || res.status === statusFilter;
    const matchesPlatform = platformFilter === 'all' || res.platform === platformFilter;

    return matchesSearch && matchesStatus && matchesPlatform;
  });

  // Unique platforms for filter dropdown
  const platforms = Array.from(new Set(reservations.map(r => r.platform)));

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Nouveau': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Confirmé': return 'bg-green-100 text-green-800 border-green-200';
      case 'En cours': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Terminé': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    if (status.toLowerCase().includes('non')) return 'text-red-600 bg-red-50';
    if (status.toLowerCase().includes('partiel')) return 'text-orange-600 bg-orange-50';
    return 'text-green-600 bg-green-50';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header Controls */}
      <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h3 className="text-lg font-semibold text-gray-800">Dernières Réservations</h3>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Rechercher..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-64"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <select 
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="all">Toutes les plateformes</option>
              {platforms.map(p => <option key={p} value={p}>{p}</option>)}
            </select>

            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="all">Tous les statuts</option>
              <option value="Nouveau">Nouveau</option>
              <option value="Confirmé">Confirmé</option>
              <option value="En cours">En cours</option>
              <option value="Terminé">Terminé</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 text-xs uppercase font-medium text-gray-500">
            <tr>
              <th className="px-6 py-3">Client / Ref</th>
              <th className="px-6 py-3">Plateforme</th>
              <th className="px-6 py-3">Activité</th>
              <th className="px-6 py-3">Transport</th>
              <th className="px-6 py-3">Montant</th>
              <th className="px-6 py-3">Statut</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredReservations.length > 0 ? (
              filteredReservations.map((res) => (
                <tr key={res.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{res.customer_name}</div>
                    <div className="text-xs text-gray-400 font-mono mt-0.5">{res.reservation_id}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
                      {res.platform}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-gray-900 max-w-[150px] truncate" title={res.activity_type}>{res.activity_type}</div>
                    <div className="flex items-center text-xs text-gray-400 mt-0.5">
                      <Calendar className="w-3 h-3 mr-1" />
                      {res.activity_date}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {res.transport_included ? (
                        <div className="flex items-center text-green-600 text-xs bg-green-50 px-2 py-1 rounded-full">
                          <Bus className="w-3 h-3 mr-1" />
                          <span>Oui</span>
                        </div>
                      ) : (
                        <div className="text-gray-400 text-xs bg-gray-50 px-2 py-1 rounded-full">Non</div>
                      )}
                      {res.transport_included && res.pickup_address && (
                        <div className="hidden group-hover:block absolute bg-gray-800 text-white text-xs p-2 rounded shadow-lg z-10 -mt-8 ml-10 max-w-xs">
                          {res.pickup_address}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{res.total_amount} €</div>
                    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${getPaymentStatusColor(res.payment_status)}`}>
                      {res.payment_status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <select 
                      value={res.status}
                      onChange={(e) => onStatusChange(res.id, e.target.value as any)}
                      className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(res.status)} cursor-pointer focus:outline-none focus:ring-1 focus:ring-offset-1`}
                    >
                      <option value="Nouveau">Nouveau</option>
                      <option value="Confirmé">Confirmé</option>
                      <option value="En cours">En cours</option>
                      <option value="Terminé">Terminé</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors">
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                  <div className="flex flex-col items-center">
                    <Filter className="w-8 h-8 mb-2 opacity-20" />
                    <p>Aucune réservation trouvée pour ces critères.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;