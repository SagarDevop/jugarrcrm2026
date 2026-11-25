import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { NavLink } from 'react-router-dom';
import { api } from '../../lib/api';
import { Client } from '@agencyos/shared';
import { Users, Search, Building, Phone, Mail, Eye, ShieldAlert } from 'lucide-react';

export const SalesClientsPage: React.FC = () => {
  const [search, setSearch] = useState('');

  const { data: clients, isLoading } = useQuery<Client[]>({
    queryKey: ['sales-clients', search],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      return api.get(`/clients?${params.toString()}`);
    },
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header with Permission Context Banner */}
      <div className="cream-card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-charcoal-900 tracking-tight">Shared Client Directory</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                Directory
              </span>
            </div>
            <p className="text-xs text-charcoal-600 mt-1">
              Cross-company client accounts with authorized operational contact information.
            </p>
          </div>
          <div className="flex items-center gap-2 p-2 bg-cream-200 border border-cream-300 rounded-lg text-[11px] text-charcoal-700">
            <ShieldAlert size={14} className="text-amber-600 shrink-0" />
            <span>Sensitive financial profit margins & recognized expenses are restricted</span>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search size={16} className="text-charcoal-400 absolute left-3 top-2.5" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by client name, business name, phone or email..."
          className="w-full bg-white border border-cream-300 rounded-lg pl-9 pr-3 py-2 text-xs text-charcoal-900 placeholder:text-charcoal-400 focus:outline-none focus:border-emerald-700"
        />
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-charcoal-500">Loading client directory...</div>
        ) : clients && clients.length > 0 ? (
          clients.map((client) => (
            <div key={client._id} className="cream-card p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="font-bold text-charcoal-900 text-sm truncate">{client.clientName}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      client.status === 'Active'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : 'bg-cream-200 text-charcoal-700 border-cream-300'
                    }`}
                  >
                    {client.status}
                  </span>
                </div>

                <div className="text-xs text-charcoal-600 flex items-center gap-1.5 mt-1.5 font-medium">
                  <Building size={13} className="text-charcoal-400" />
                  <span className="truncate">{client.businessName}</span>
                </div>

                <div className="mt-4 pt-3 border-t border-cream-300 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-charcoal-800">
                    <Phone size={13} className="text-charcoal-400" />
                    <span>{client.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-charcoal-800">
                    <Mail size={13} className="text-charcoal-400" />
                    <span className="truncate">{client.email}</span>
                  </div>
                  {client.industry && (
                    <div className="text-[11px] text-charcoal-600">
                      Industry: <span className="text-charcoal-900 font-semibold">{client.industry}</span>
                    </div>
                  )}
                  {client.serviceCategory && (
                    <div className="text-[11px] text-charcoal-600">
                      Service: <span className="text-charcoal-900 font-semibold">{client.serviceCategory}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-cream-300 flex items-center justify-between">
                <span className="text-[11px] text-charcoal-500">
                  Assigned: {(client.assignedSalesMember as any)?.name || 'Direct'}
                </span>
                <NavLink
                  to={`/sales/clients/${client._id}`}
                  className="px-3 py-1 bg-cream-200 hover:bg-cream-300 text-charcoal-900 border border-cream-300 rounded text-xs font-semibold transition-colors flex items-center gap-1"
                >
                  <Eye size={12} /> View Details
                </NavLink>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-charcoal-500">
            No clients found matching the search criteria.
          </div>
        )}
      </div>
    </div>
  );
};
