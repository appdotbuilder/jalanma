import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import { MapPin, Camera, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import type { User, RoadDamageReport, CreateRoadDamageReportInput } from '../../../server/src/schema';

interface ReportFormProps {
  user: User;
  onReportCreated: (report: RoadDamageReport) => void;
  isDarkMode: boolean;
}

export function ReportForm({ user, onReportCreated, isDarkMode }: ReportFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState<CreateRoadDamageReportInput>({
    reporter_name: user.name,
    reporter_phone: '',
    reporter_address: '',
    report_date: new Date(),
    damage_description: null,
    photo_url: '',
    latitude: 0,
    longitude: 0,
  });

  const [locationText, setLocationText] = useState('');

  // Get current location using GPS
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation tidak didukung oleh browser Anda');
      return;
    }

    setIsGettingLocation(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      (position: GeolocationPosition) => {
        const { latitude, longitude } = position.coords;
        setFormData((prev: CreateRoadDamageReportInput) => ({
          ...prev,
          latitude,
          longitude,
        }));
        setLocationText(`Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`);
        setIsGettingLocation(false);
      },
      (error: GeolocationPositionError) => {
        setError('Gagal mendapatkan lokasi. Pastikan GPS diaktifkan.');
        setIsGettingLocation(false);
        console.error('Geolocation error:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  // Handle photo upload (simplified version)
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);
      
      // In a real app, this would upload to a cloud storage service
      // For now, we'll create a placeholder URL
      const photoUrl = `https://placeholder-bucket.s3.amazonaws.com/photos/${Date.now()}-${file.name}`;
      
      setFormData((prev: CreateRoadDamageReportInput) => ({
        ...prev,
        photo_url: photoUrl,
      }));
      
      setSuccess('Foto berhasil diunggah!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Gagal mengunggah foto');
      console.error('Photo upload error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    // Validation
    if (!formData.reporter_phone.trim()) {
      setError('Nomor telepon wajib diisi');
      setIsLoading(false);
      return;
    }

    if (!formData.reporter_address.trim()) {
      setError('Alamat wajib diisi');
      setIsLoading(false);
      return;
    }

    if (!formData.photo_url) {
      setError('Foto kerusakan wajib diunggah');
      setIsLoading(false);
      return;
    }

    if (formData.latitude === 0 || formData.longitude === 0) {
      setError('Lokasi GPS belum didapatkan. Klik tombol "Dapatkan Lokasi"');
      setIsLoading(false);
      return;
    }

    try {
      const report = await trpc.createRoadDamageReport.mutate({
        ...formData,
        user_id: user.id,
      });

      onReportCreated(report);
      setSuccess('Laporan berhasil dibuat! Terima kasih atas kontribusi Anda.');
      
      // Reset form
      setFormData({
        reporter_name: user.name,
        reporter_phone: '',
        reporter_address: '',
        report_date: new Date(),
        damage_description: null,
        photo_url: '',
        latitude: 0,
        longitude: 0,
      });
      setLocationText('');

    } catch (error) {
      setError('Gagal membuat laporan. Silakan coba lagi.');
      console.error('Create report error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Form Laporan Kerusakan
        </CardTitle>
        <CardDescription>
          Lengkapi informasi berikut untuk melaporkan kerusakan jalan
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Success Message */}
          {success && (
            <Alert className="border-green-200 bg-green-50 dark:bg-green-900/10">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700 dark:text-green-400">
                {success}
              </AlertDescription>
            </Alert>
          )}

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Reporter Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Informasi Pelapor</h3>
            
            <div className="space-y-2">
              <Label htmlFor="reporter_name">Nama Lengkap</Label>
              <Input
                id="reporter_name"
                value={formData.reporter_name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateRoadDamageReportInput) => ({ 
                    ...prev, 
                    reporter_name: e.target.value 
                  }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reporter_phone">Nomor Telepon</Label>
              <Input
                id="reporter_phone"
                type="tel"
                placeholder="08xxxxxxxxxx"
                value={formData.reporter_phone}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateRoadDamageReportInput) => ({ 
                    ...prev, 
                    reporter_phone: e.target.value 
                  }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reporter_address">Alamat Lengkap</Label>
              <Textarea
                id="reporter_address"
                placeholder="Masukkan alamat lengkap Anda"
                value={formData.reporter_address}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData((prev: CreateRoadDamageReportInput) => ({ 
                    ...prev, 
                    reporter_address: e.target.value 
                  }))
                }
                required
              />
            </div>
          </div>

          {/* Report Details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Detail Laporan</h3>

            <div className="space-y-2">
              <Label htmlFor="report_date">Tanggal Laporan</Label>
              <Input
                id="report_date"
                type="date"
                value={formData.report_date.toISOString().split('T')[0]}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateRoadDamageReportInput) => ({ 
                    ...prev, 
                    report_date: new Date(e.target.value) 
                  }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="damage_description">Deskripsi Kerusakan (Opsional)</Label>
              <Textarea
                id="damage_description"
                placeholder="Jelaskan kondisi kerusakan jalan yang ditemukan"
                value={formData.damage_description || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData((prev: CreateRoadDamageReportInput) => ({ 
                    ...prev, 
                    damage_description: e.target.value || null 
                  }))
                }
                rows={3}
              />
            </div>

            {/* Photo Upload */}
            <div className="space-y-2">
              <Label htmlFor="photo">Foto Kerusakan *</Label>
              <Input
                id="photo"
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                disabled={isLoading}
              />
              {formData.photo_url && (
                <p className="text-sm text-green-600 dark:text-green-400">
                  ✓ Foto berhasil diunggah
                </p>
              )}
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label>Lokasi GPS *</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={getCurrentLocation}
                  disabled={isGettingLocation}
                  className="flex items-center gap-2"
                >
                  {isGettingLocation ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Mendapatkan Lokasi...
                    </>
                  ) : (
                    <>
                      <MapPin className="h-4 w-4" />
                      Dapatkan Lokasi
                    </>
                  )}
                </Button>
              </div>
              {locationText && (
                <p className="text-sm text-green-600 dark:text-green-400">
                  ✓ Lokasi: {locationText}
                </p>
              )}
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={isLoading} 
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Membuat Laporan...
              </>
            ) : (
              'Kirim Laporan'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}