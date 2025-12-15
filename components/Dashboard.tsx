import React, { useState } from 'react';
import { Reservation } from '../types';
import { Search, Filter, MoreHorizontal, Bus, Calendar, DollarSign, ExternalLink, X, User, Mail, Phone, MapPin, Utensils, CreditCard, Clock, AlertTriangle, Info, Bot, FileText } from 'lucide-react';
import { format } from 'date-fns';

interface DashboardProps {
  reservations: Reservation[];
  onStatusChange: (id: string, newStatus: Reservation['status']) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ reservations, onStatusChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [selectedRes, setSelectedRes] = useState<Reservation | null>(null);

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
    switch (status) {
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
              <th className="px-6 py-3">Pax</th>
              <th className="px-6 py-3">Transport</th>
              <th className="px-6 py-3">Montant</th>
              <th className="px-6 py-3">Statut</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredReservations.length > 0 ? (
              filteredReservations.map((res) => (
                <tr
                  key={res.id}
                  onClick={() => setSelectedRes(res)}
                  className="hover:bg-gray-50 transition-colors group cursor-pointer"
                >
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900" title={res.email || res.phone || ''}>
                      {res.customer_name}
                    </div>
                    <div className="text-xs text-gray-400 font-mono mt-0.5">{res.reservation_id}</div>
                    {(res.phone || res.email) && (
                      <div className="hidden group-hover:block absolute bg-gray-800 text-white text-xs p-2 rounded shadow-lg z-10 mt-1">
                        {res.phone && <div>📞 {res.phone}</div>}
                        {res.email && <div>✉️ {res.email}</div>}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
                      {res.platform}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-gray-900 max-w-[150px] truncate" title={res.activity_type}>{res.activity_type}</div>
                    {res.menu_choice && (
                      <div className="text-xs text-purple-600 font-medium mt-0.5">🍽️ {res.menu_choice}</div>
                    )}
                    <div className="flex items-center text-xs text-gray-400 mt-0.5">
                      <Calendar className="w-3 h-3 mr-1" />
                      {res.activity_date}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 font-medium">{res.people_count} pers.</div>
                    {(res.adults_count !== undefined || res.children_count !== undefined) && (
                      <div className="text-xs text-gray-500">
                        {res.adults_count ? `${res.adults_count} Ad` : ''}
                        {res.adults_count && res.children_count ? ', ' : ''}
                        {res.children_count ? `${res.children_count} Enf` : ''}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {res.transport_included ? (
                        <div className="flex items-center text-green-600 text-xs bg-green-50 px-2 py-1 rounded-full cursor-help">
                          <Bus className="w-3 h-3 mr-1" />
                          <span>Oui</span>
                        </div>
                      ) : (
                        <div className="text-gray-400 text-xs bg-gray-50 px-2 py-1 rounded-full">Non</div>
                      )}
                      {res.transport_included && res.pickup_address && (
                        <div className="hidden group-hover:block absolute bg-gray-800 text-white text-xs p-2 rounded shadow-lg z-10 -mt-8 ml-10 max-w-xs">
                          📍 {res.pickup_address}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">
                      {res.amount_eur ? res.amount_eur : res.total_amount} €
                      {res.original_currency && res.original_currency !== 'EUR' && (
                        <span className="ml-1 text-xs text-gray-400" title={`Montant original: ${res.original_amount} ${res.original_currency}`}>
                          (conv.)
                        </span>
                      )}
                    </div>
                    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${getPaymentStatusColor(res.payment_status)}`}>
                      {res.payment_status}
                    </span>
                    {res.validation_flags && res.validation_flags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {res.validation_flags.map((flag, idx) => (
                          <span key={idx} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-800" title={flag}>
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Attention
                          </span>
                        ))}
                      </div>
                    )}
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

      {/* DETAILS MODAL */}
      {selectedRes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-indigo-600 p-6 text-white flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <User className="w-5 h-5" /> {selectedRes.customer_name}
                </h2>
                <p className="text-indigo-100 text-sm mt-1 flex items-center gap-2">
                  <span className="bg-white/20 px-2 py-0.5 rounded text-xs font-mono">{selectedRes.reservation_id}</span>
                  <span>via {selectedRes.platform}</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedRes(null)}
                className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Contact Info */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Contact</h4>

                <div className="flex items-center gap-3 text-gray-700">
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="font-medium">{selectedRes.email || 'Non renseigné'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-gray-700">
                  <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Téléphone</p>
                    <p className="font-medium">{selectedRes.phone || 'Non renseigné'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-gray-700">
                  <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Lieu de prise en charge</p>
                    <p className="font-medium">{selectedRes.pickup_address || 'Non inclus'}</p>
                  </div>
                </div>
              </div>

              {/* Activity Info */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Détails Activité</h4>

                <div className="flex items-center gap-3 text-gray-700">
                  <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Date & Activité</p>
                    <p className="font-medium">{selectedRes.activity_date}</p>
                    <p className="text-sm text-gray-600">{selectedRes.activity_type}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-gray-700">
                  <div className="w-8 h-8 rounded-full bg-pink-50 flex items-center justify-center text-pink-600">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Participants</p>
                    <p className="font-medium">
                      {selectedRes.people_count} Personnes
                      <span className="text-sm text-gray-500 font-normal ml-1">
                        ({selectedRes.adults_count || 0} Adultes, {selectedRes.children_count || 0} Enfants)
                      </span>
                    </p>
                  </div>
                </div>

                {selectedRes.menu_choice && (
                  <div className="flex items-center gap-3 text-gray-700">
                    <div className="w-8 h-8 rounded-full bg-yellow-50 flex items-center justify-center text-yellow-600">
                      <Utensils className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Choix du Menu</p>
                      <p className="font-medium text-yellow-700 bg-yellow-50 px-2 py-0.5 rounded inline-block">
                        {selectedRes.menu_choice}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Payment & Status */}
              <div className="col-span-1 md:col-span-2 border-t border-gray-100 pt-4 mt-2 flex justify-between items-center bg-gray-50 p-4 rounded-xl">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Montant Total</p>
                  <p className="text-2xl font-bold text-gray-900">{selectedRes.total_amount} €</p>
                  <p className={`text-xs font-bold uppercase ${getPaymentStatusColor(selectedRes.payment_status)}`}>
                    {selectedRes.payment_status}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs text-gray-500 mb-1">Statut Réservation</p>
                  <select
                    value={selectedRes.status}
                    onChange={(e) => onStatusChange(selectedRes.id, e.target.value as any)}
                    className={`text-sm px-3 py-1.5 rounded-lg border ${getStatusColor(selectedRes.status)} font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                  >
                    <option value="Nouveau">Nouveau</option>
                    <option value="Confirmé">Confirmé</option>
                    <option value="En cours">En cours</option>
                    <option value="Terminé">Terminé</option>
                  </select>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
      {/* DETAILS MODAL */}
      {selectedRes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-indigo-600 p-6 text-white flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <User className="w-5 h-5" /> {selectedRes.customer_name}
                </h2>
                <p className="text-indigo-100 text-sm mt-1 flex items-center gap-2">
                  <span className="bg-white/20 px-2 py-0.5 rounded text-xs font-mono">{selectedRes.reservation_id}</span>
                  <span>via {selectedRes.platform}</span>
                  {selectedRes.extraction_source === 'ai' ? (
                    <span className="flex items-center gap-1 bg-green-400/20 px-2 py-0.5 rounded text-xs" title="Extrait par IA">
                      <Bot className="w-3 h-3" /> IA
                    </span>
                  ) : selectedRes.extraction_source === 'regex' ? (
                    <span className="flex items-center gap-1 bg-yellow-400/20 px-2 py-0.5 rounded text-xs" title="Extrait par Regex (Secours)">
                      <FileText className="w-3 h-3" /> Regex
                    </span>
                  ) : null}
                </p>
              </div>
              <button
                onClick={() => setSelectedRes(null)}
                className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Contact Info */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Contact</h4>

                <div className="flex items-center gap-3 text-gray-700">
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="font-medium">{selectedRes.email || 'Non renseigné'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-gray-700">
                  <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Téléphone</p>
                    <p className="font-medium">{selectedRes.phone || 'Non renseigné'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-gray-700">
                  <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Lieu de prise en charge</p>
                    <p className="font-medium">{selectedRes.pickup_address || 'Non inclus'}</p>
                  </div>
                </div>
              </div>

              {/* Activity Info */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Détails Activité</h4>

                <div className="flex items-center gap-3 text-gray-700">
                  <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Date & Activité</p>
                    <p className="font-medium">{selectedRes.activity_date}</p>
                    <p className="text-sm text-gray-600">{selectedRes.activity_type}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-gray-700">
                  <div className="w-8 h-8 rounded-full bg-pink-50 flex items-center justify-center text-pink-600">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Participants</p>
                    <p className="font-medium">
                      {selectedRes.people_count} Personnes
                      <span className="text-sm text-gray-500 font-normal ml-1">
                        ({selectedRes.adults_count || 0} Adultes, {selectedRes.children_count || 0} Enfants)
                      </span>
                    </p>
                  </div>
                </div>

                {selectedRes.menu_choice && (
                  <div className="flex items-center gap-3 text-gray-700">
                    <div className="w-8 h-8 rounded-full bg-yellow-50 flex items-center justify-center text-yellow-600">
                      <Utensils className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Choix du Menu</p>
                      <p className="font-medium text-yellow-700 bg-yellow-50 px-2 py-0.5 rounded inline-block">
                        {selectedRes.menu_choice}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Payment & Status */}
              <div className="col-span-1 md:col-span-2 border-t border-gray-100 pt-4 mt-2 flex justify-between items-center bg-gray-50 p-4 rounded-xl">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Montant Total</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-bold text-gray-900">
                      {selectedRes.amount_eur ? selectedRes.amount_eur : selectedRes.total_amount} €
                    </p>
                    {selectedRes.original_currency && selectedRes.original_currency !== 'EUR' && (
                      <p className="text-sm text-gray-500">
                        ({selectedRes.original_amount} {selectedRes.original_currency})
                      </p>
                    )}
                  </div>
                  <p className={`text-xs font-bold uppercase ${getPaymentStatusColor(selectedRes.payment_status)}`}>
                    {selectedRes.payment_status}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs text-gray-500 mb-1">Statut Réservation</p>
                  <select
                    value={selectedRes.status}
                    onChange={(e) => onStatusChange(selectedRes.id, e.target.value as any)}
                    className={`text-sm px-3 py-1.5 rounded-lg border ${getStatusColor(selectedRes.status)} font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                  >
                    <option value="Nouveau">Nouveau</option>
                    <option value="Confirmé">Confirmé</option>
                    <option value="En cours">En cours</option>
                    <option value="Terminé">Terminé</option>
                  </select>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;