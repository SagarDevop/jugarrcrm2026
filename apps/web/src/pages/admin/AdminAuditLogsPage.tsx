import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { AuditLog } from '@agencyos/shared';
import { formatDate } from '../../lib/utils';
import { ShieldCheck, Clock, User } from 'lucide-react';

export const AdminAuditLogsPage: React.FC = () => {
  const { data: logs, isLoading } = useQuery<AuditLog[]>({
    queryKey: ['admin-audit-logs'],
    queryFn: () => api.get('/audit'),
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-charcoal-900 tracking-tight">System Audit Logs</h1>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            Immutable Trail
          </span>
        </div>
        <p className="text-xs text-charcoal-600 mt-1">
          Immutable audit trail tracking security events, payment verifications and administrative actions
        </p>
      </div>

      {/* Audit Log Table */}
      <div className="cream-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F5EFE6] text-charcoal-700 font-semibold border-b border-cream-300 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-300 bg-white font-mono text-[11px]">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-charcoal-500 font-sans">
                    Loading audit trail...
                  </td>
                </tr>
              ) : logs && logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log._id} className="hover:bg-cream-100/60 transition-colors">
                    <td className="py-3 px-4 text-charcoal-600 font-sans">{formatDate(log.createdAt)}</td>
                    <td className="py-3 px-4 font-bold text-blue-700">{log.action}</td>
                    <td className="py-3 px-4 text-charcoal-900 font-sans font-medium">{log.userEmail}</td>
                    <td className="py-3 px-4 text-charcoal-700">
                      {log.entityType} #{log.entityId.slice(-6)}
                    </td>
                    <td className="py-3 px-4 text-charcoal-500">{log.ipAddress || '127.0.0.1'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-charcoal-500 font-sans">
                    No audit records logged yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
