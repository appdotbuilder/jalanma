import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, Navigation, Layers, Info, ExternalLink } from 'lucide-react';
import type { RoadDamageReport } from '../../../server/src/schema';

interface MapViewProps {
  reports: RoadDamageReport[];
  isDarkMode: boolean;
}

interface MapStats {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
  rejected: number;
}

export function MapView({ reports, isDarkMode }: MapViewProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedReport, setSelectedReport] = useState<RoadDamageReport | null>(null);

  // Filter reports based on status
  const filteredReports = useMemo(() => {
    return statusFilter === 'all' 
      ? reports 
      : reports.filter((report: RoadDamageReport) => report.status === statusFilter);
  }, [reports, statusFilter]);

  // Calculate statistics
  const stats: MapStats = useMemo(() => {
    return reports.reduce((acc: MapStats, report: RoadDamageReport) => {
      acc.total++;
      switch (report.status) {
        case 'pending':
          acc.pending++;
          break;
        case 'in_progress':
          acc.inProgress++;
          break;
        case 'resolved':
          acc.resolved++;
          break;
        case 'rejected':
          acc.rejected++;
          break;
      }
      return acc;
    }, { total: 0, pending: 0, inProgress: 0, resolved: 0, rejected: 0 });
  }, [reports]);

  // Get center point of all reports
  const mapCenter = useMemo(() => {
    if (filteredReports.length === 0) {
      return { lat: -6.2088, lng: 106.8456 }; // Default to Jakarta
    }

    const totalLat = filteredReports.reduce((sum: number, report: RoadDamageReport) => sum + report.latitude, 0);
    const totalLng = filteredReports.reduce((sum: number, report: RoadDamageReport) => sum + report.longitude, 0);

    return {
      lat: totalLat / filteredReports.length,
      lng: totalLng / filteredReports.length
    };
  }, [filteredReports]);

  // Status color mapping
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500';
      case 'in_progress':
        return 'bg-blue-500';
      case 'resolved':
        return 'bg-green-500';
      case 'rejected':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

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

  // Open location in external map service
  const openInGoogleMaps = (report: RoadDamageReport) => {
    const url = `https://www.google.com/maps?q=${report.latitude},${report.longitude}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="text-center">
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-bold">{stats.total}</CardTitle>
            <CardDescription>Total Laporan</CardDescription>
          </CardHeader>
        </Card>
        
        <Card className="text-center">
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-bold text-yellow-600">{stats.pending}</CardTitle>
            <CardDescription>Menunggu</CardDescription>
          </CardHeader>
        </Card>
        
        <Card className="text-center">
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-bold text-blue-600">{stats.inProgress}</CardTitle>
            <CardDescription>Ditangani</CardDescription>
          </CardHeader>
        </Card>
        
        <Card className="text-center">
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-bold text-green-600">{stats.resolved}</CardTitle>
            <CardDescription>Selesai</CardDescription>
          </CardHeader>
        </Card>
        
        <Card className="text-center">
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-bold text-red-600">{stats.rejected}</CardTitle>
            <CardDescription>Ditolak</CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4" />
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
          {filteredReports.length} dari {reports.length} laporan ditampilkan
        </div>
      </div>

      {/* Map Placeholder with Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Peta Interaktif
          </CardTitle>
          <CardDescription>
            Visualisasi lokasi kerusakan jalan (fitur integrasi peta akan ditambahkan)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Placeholder for map integration */}
          <div className="relative">
            <div 
              className={`w-full h-96 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center ${
                isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
              }`}
            >
              <div className="text-center space-y-4">
                <Navigation className="h-16 w-16 mx-auto text-gray-400" />
                <div>
                  <h3 className="font-semibold text-lg">Peta Interaktif Segera Hadir</h3>
                  <p className="text-gray-600 dark:text-gray-400 max-w-md">
                    Integrasi dengan Google Maps atau OpenStreetMap akan menampilkan lokasi kerusakan jalan secara visual
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                    Pusat Peta: {mapCenter.lat.toFixed(4)}, {mapCenter.lng.toFixed(4)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Implementation Notice */}
          <Alert className="mt-4">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Catatan Implementasi:</strong> Untuk implementasi lengkap, peta ini akan menggunakan 
              Google Maps API atau Leaflet dengan OpenStreetMap untuk menampilkan marker lokasi kerusakan jalan 
              dengan clustering dan popup informasi detail.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Reports List for Map */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Daftar Lokasi ({filteredReports.length})
          </CardTitle>
          <CardDescription>
            Klik pada lokasi untuk melihat detail laporan
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredReports.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                Tidak ada laporan dengan filter yang dipilih
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredReports.map((report: RoadDamageReport) => (
                <div 
                  key={report.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
                    selectedReport?.id === report.id 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                  onClick={() => setSelectedReport(report)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(report.status)}`}></div>
                        <h4 className="font-medium truncate">{report.reporter_name}</h4>
                        <Badge variant="outline" className="text-xs">
                          {getStatusText(report.status)}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 line-clamp-2">
                        {report.reporter_address}
                      </p>
                      
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        GPS: {report.latitude.toFixed(6)}, {report.longitude.toFixed(6)}
                      </p>
                      
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        {report.report_date.toLocaleDateString('id-ID')}
                      </p>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        openInGoogleMaps(report);
                      }}
                      className="flex items-center gap-1 shrink-0"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Peta
                    </Button>
                  </div>
                  
                  {selectedReport?.id === report.id && report.damage_description && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-medium mb-1">Deskripsi:</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {report.damage_description}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}