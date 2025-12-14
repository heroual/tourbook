import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import StatsCards from './components/StatsCards';
import Dashboard from './components/Dashboard';
import EmailIngester from './components/EmailIngester';
import { Reservation, ReservationStatus } from './types';
import { MOCK_RESERVATIONS } from './constants';

const App: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>(MOCK_RESERVATIONS);

  // In a real app, this would fetch from a database (Supabase/PostgreSQL)
  // For this demo, we initialize with constants and update local state

  const handleReservationAdded = (newReservation: Reservation) => {
    setReservations(prev => [newReservation, ...prev]);
  };

  const handleStatusChange = (id: string, newStatus: ReservationStatus) => {
    setReservations(prev => prev.map(res => 
      res.id === id ? { ...res, status: newStatus } : res
    ));
  };

  return (
    <Layout>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Vue d'ensemble</h2>
        <p className="text-gray-500 mt-1">Gérez vos réservations entrantes et suivez vos performances.</p>
      </div>

      <StatsCards reservations={reservations} />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Email AI Agent */}
        <div className="lg:col-span-1">
           <div className="sticky top-8">
             <EmailIngester onReservationAdded={handleReservationAdded} />
             
             {/* Info Card */}
             <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl p-6 text-white shadow-lg">
               <h3 className="font-semibold text-lg mb-2">Comment ça marche ?</h3>
               <p className="text-indigo-100 text-sm leading-relaxed mb-4">
                 Notre agent IA scanne automatiquement vos emails entrants (Gmail) pour détecter les nouvelles réservations des plateformes comme Viator, Booking ou Airbnb.
               </p>
               <div className="text-xs font-mono bg-white/10 p-3 rounded border border-white/20">
                  {'>'} Analysing email content...<br/>
                  {'>'} Extracting JSON data...<br/>
                  {'>'} Updating dashboard...
               </div>
             </div>
           </div>
        </div>

        {/* Right Column: Dashboard Table */}
        <div className="lg:col-span-2">
          <Dashboard 
            reservations={reservations} 
            onStatusChange={handleStatusChange} 
          />
        </div>
      </div>
    </Layout>
  );
};

export default App;
