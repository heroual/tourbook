import React from 'react';
import { Reservation } from '../types';
import { Users, Calendar, DollarSign, Briefcase } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface StatsCardsProps {
  reservations: Reservation[];
}

const StatsCards: React.FC<StatsCardsProps> = ({ reservations }) => {
  const totalRevenue = reservations.reduce((acc, curr) => acc + (curr.total_amount || 0), 0);
  const totalPeople = reservations.reduce((acc, curr) => acc + (curr.people_count || 0), 0);
  const activeReservations = reservations.filter(r => r.status === 'Nouveau' || r.status === 'Confirmé').length;
  const completedReservations = reservations.filter(r => r.status === 'Terminé').length;

  // Prepare data for chart: Revenue by Platform
  const platformData = reservations.reduce((acc, curr) => {
    const existing = acc.find(p => p.name === curr.platform);
    if (existing) {
      existing.value += 1;
      existing.revenue += curr.total_amount;
    } else {
      acc.push({ name: curr.platform, value: 1, revenue: curr.total_amount });
    }
    return acc;
  }, [] as { name: string; value: number; revenue: number }[]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Card 1: Revenue */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">Chiffre d'affaires</p>
          <p className="text-2xl font-bold text-gray-900">{totalRevenue.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</p>
        </div>
        <div className="p-3 bg-green-50 rounded-full">
          <DollarSign className="w-6 h-6 text-green-600" />
        </div>
      </div>

      {/* Card 2: People */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">Pax Total</p>
          <p className="text-2xl font-bold text-gray-900">{totalPeople}</p>
        </div>
        <div className="p-3 bg-blue-50 rounded-full">
          <Users className="w-6 h-6 text-blue-600" />
        </div>
      </div>

       {/* Card 3: Active Bookings */}
       <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">Réservations Actives</p>
          <p className="text-2xl font-bold text-gray-900">{activeReservations}</p>
        </div>
        <div className="p-3 bg-purple-50 rounded-full">
          <Calendar className="w-6 h-6 text-purple-600" />
        </div>
      </div>

       {/* Card 4: Chart Mini */}
       <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col justify-center h-32 md:h-auto">
         <p className="text-xs font-medium text-gray-500 mb-2">Répartition par plateforme</p>
         <div className="flex-1 min-h-[60px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={platformData}>
                <XAxis dataKey="name" hide />
                <Tooltip 
                  contentStyle={{ fontSize: '12px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#374151' }}
                  cursor={{fill: 'transparent'}}
                />
                <Bar dataKey="value" radius={[4, 4, 4, 4]}>
                  {platformData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
         </div>
      </div>
    </div>
  );
};

export default StatsCards;