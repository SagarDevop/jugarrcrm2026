import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Notification } from '@agencyos/shared';
import { formatDate } from '../../lib/utils';
import { Bell, CheckCheck } from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications'),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => api.put('/notifications/all/read'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-charcoal-900 tracking-tight">System Notifications</h1>
          <p className="text-xs text-charcoal-600 mt-1">Real-time alerts, lead conversions and financial updates</p>
        </div>
        <button
          onClick={() => markAllReadMutation.mutate()}
          className="px-3.5 py-1.5 bg-cream-200 hover:bg-cream-300 text-charcoal-900 border border-cream-300 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
        >
          <CheckCheck size={14} /> Mark All as Read
        </button>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="py-12 text-center text-charcoal-500 text-xs">Loading notifications...</div>
        ) : notifications && notifications.length > 0 ? (
          notifications.map((n) => (
            <div
              key={n._id}
              className={`p-4 rounded-xl border transition-all ${
                n.read
                  ? 'cream-card text-charcoal-600'
                  : 'bg-white border-blue-300 text-charcoal-900 shadow-md shadow-blue-500/5'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      n.read ? 'bg-cream-200 text-charcoal-500' : 'bg-blue-50 text-blue-700'
                    }`}
                  >
                    <Bell size={16} />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-charcoal-900">{n.title}</h2>
                    <p className="text-xs text-charcoal-600 mt-0.5">{n.message}</p>
                  </div>
                </div>
                <span className="text-[10px] text-charcoal-500 whitespace-nowrap">{formatDate(n.createdAt)}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="py-12 text-center text-charcoal-500 text-xs">No notifications right now.</div>
        )}
      </div>
    </div>
  );
};
