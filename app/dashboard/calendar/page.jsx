'use client';
import { useState } from 'react';
import { JOURNEES_INTERNATIONALES } from '@/lib/constants'; // Ensure this path matches where you saved the array

export default function CalendarUI() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDay, setSelectedDay] = useState(null);

  // Filter days based on search
  const filteredDays = JOURNEES_INTERNATIONALES.filter(day => 
    day.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Calendrier des Actions</h1>
          <p className="text-gray-500 mt-2">Sélectionnez une journée internationale pour soumettre le travail de votre club.</p>
        </div>
        <input 
          type="text" 
          placeholder="Rechercher une journée..." 
          className="px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 outline-none w-72"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Grid of International Days */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDays.map((journee, index) => (
          <div 
            key={index} 
            onClick={() => setSelectedDay(journee)}
            className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-300 transition cursor-pointer flex flex-col justify-between h-full group"
          >
            <div>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full mb-3 inline-block">
                {journee.date}
              </span>
              <h3 className="text-lg font-bold text-gray-800 group-hover:text-blue-700 transition">
                {journee.name}
              </h3>
            </div>
            <div className="mt-4 text-sm font-medium text-gray-400 group-hover:text-blue-500 flex justify-end">
              Soumettre →
            </div>
          </div>
        ))}
      </div>

      {/* Custom Day Option */}
      <div className="mt-8 p-6 bg-gray-50 rounded-xl border border-dashed border-gray-300 text-center">
        <p className="text-gray-600 mb-4">Vous ne trouvez pas la journée que vous cherchez ?</p>
        <button className="px-6 py-2 bg-gray-900 text-white font-bold rounded-lg hover:bg-gray-800 transition">
          + Ajouter une journée personnalisée
        </button>
      </div>

      {/* Placeholder for the Modal/Form when a day is clicked */}
      {selectedDay && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl max-w-lg w-full space-y-6">
             <h2 className="text-2xl font-bold">Soumettre pour: <br/><span className="text-blue-600">{selectedDay.name}</span></h2>
             {/* The form from the previous step goes here */}
             <button onClick={() => setSelectedDay(null)} className="w-full py-3 bg-gray-200 rounded-lg font-bold">Fermer (Test UI)</button>
          </div>
        </div>
      )}
    </div>
  );
}