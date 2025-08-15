import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Phone, Calendar, User, FileText, ExternalLink } from 'lucide-react';
import type { RoadDamageReport } from '../../../server/src/schema';

interface ReportsListProps {
  reports: RoadDamageReport[];
  isLoading: boolean;
  isDarkMode: boolean;
}

export function ReportsList({ reports, isLoading, isDarkMode }: ReportsListProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Filter reports based on status
  const filteredReports = statusFilter === 'all' 
    ? reports 
    : reports.filter((report: RoadDamageReport) => report.status === statusFilter);

  // Status color mapping
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'resolved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  // Status text mapping
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Menunggu';
      case 'in_progress':
        return 'Sedang Ditangani';
      case 'resolved':
        return 'Selesai';
      case 'rejected':
        return 'Ditolak';
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, index) => (
          <Card key={index}>
            <CardHeader>
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Filter Status:</span>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="pending">Menunggu</SelectItem>
              <SelectItem value="in_progress">Sedang Ditangani</SelectItem>
              <SelectItem value="resolved">Selesai</SelectItem>
              <SelectItem value="rejected">Ditolak</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {filteredReports.length} dari {reports.length} laporan
        </div>
      </div>

      {/* Reports List */}
      {filteredReports.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {statusFilter === 'all' ? 'Belum Ada Laporan' : 'Tidak Ada Laporan dengan Status Ini'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {statusFilter === 'all' 
              ? 'Mulai laporkan kerusakan jalan untuk membantu memperbaiki infrastruktur'
              : 'Coba pilih filter status yang berbeda'
            }
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredReports.map((report: RoadDamageReport) => (
            <Card key={report.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {report.reporter_name}
                  </CardTitle>
                  <Badge className={getStatusColor(report.status)}>
                    {getStatusText(report.status)}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Reporter Details */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span>{report.reporter_phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span>{report.report_date.toLocaleDateString('id-ID')}</span>
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Alamat Pelapor:</p>
                    <p className="text-gray-600 dark:text-gray-400">{report.reporter_address}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      GPS: {report.latitude.toFixed(6)}, {report.longitude.toFixed(6)}
                    </p>
                  </div>
                </div>

                {/* Damage Description */}
                {report.damage_description && (
                  <div className="space-y-2">
                    <p className="font-medium text-sm">Deskripsi Kerusakan:</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                      {report.damage_description}
                    </p>
                  </div>
                )}

                {/* Photo */}
                <div className="space-y-2">
                  <p className="font-medium text-sm">Foto Kerusakan:</p>
                  <div className="flex items-center gap-2">
                    <img
                      src={report.photo_url}
                      alt="Foto kerusakan jalan"
                      className="w-24 h-24 object-cover rounded-md border"
                      onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://via.placeholder.com/96x96?text=Foto+Tidak+Tersedia';
                      }}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(report.photo_url, '_blank')}
                      className="flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Lihat Foto
                    </Button>
                  </div>
                </div>

                {/* Timestamps */}
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 space-y-1">
                  <p>Dibuat: {report.created_at.toLocaleString('id-ID')}</p>
                  <p>Diperbarui: {report.updated_at.toLocaleString('id-ID')}</p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const url = `https://www.google.com/maps?q=${report.latitude},${report.longitude}`;
                      window.open(url, '_blank');
                    }}
                    className="flex items-center gap-1"
                  >
                    <MapPin className="h-3 w-3" />
                    Lihat di Peta
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}