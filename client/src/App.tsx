import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import type { User, RoadDamageReport } from '../../server/src/schema';

// Components
import { Header } from './components/Header';
import { LoginModal } from './components/LoginModal';
import { ReportForm } from './components/ReportForm';
import { ReportsList } from './components/ReportsList';
import { MapView } from './components/MapView';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Icons
import { MapPin, List, PlusCircle, Shield } from 'lucide-react';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [reports, setReports] = useState<RoadDamageReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Load reports from server
  const loadReports = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getRoadDamageReports.query({});
      setReports(result);
    } catch (error) {
      console.error('Gagal memuat laporan:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load reports on component mount
  useEffect(() => {
    loadReports();
  }, [loadReports]);

  // Handle successful login
  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    setIsLoginModalOpen(false);
  };

  // Handle logout
  const handleLogout = () => {
    setUser(null);
  };

  // Handle new report creation
  const handleReportCreated = (newReport: RoadDamageReport) => {
    setReports((prev: RoadDamageReport[]) => [newReport, ...prev]);
  };

  // Toggle theme
  const toggleTheme = () => {
    setIsDarkMode((prev: boolean) => !prev);
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <Header
        user={user}
        onLoginClick={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
      />

      <main className="container mx-auto px-4 py-6">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-12 w-12 text-blue-600 mr-2" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              JalanMa
            </h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Platform pelaporan kerusakan jalan untuk membantu memperbaiki infrastruktur kota kita bersama-sama
          </p>
          <div className="flex justify-center gap-4 mt-4">
            <Badge variant="outline" className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              GPS Terintegrasi
            </Badge>
            <Badge variant="outline">📱 Mobile Friendly</Badge>
            <Badge variant="outline">🌍 Peta Interaktif</Badge>
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="reports" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              Daftar Laporan
            </TabsTrigger>
            <TabsTrigger value="map" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Peta
            </TabsTrigger>
            <TabsTrigger 
              value="create" 
              className="flex items-center gap-2"
              disabled={!user}
            >
              <PlusCircle className="h-4 w-4" />
              Buat Laporan
            </TabsTrigger>
          </TabsList>

          {/* Reports List Tab */}
          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <List className="h-5 w-5" />
                  Laporan Kerusakan Jalan
                </CardTitle>
                <CardDescription>
                  Daftar semua laporan kerusakan jalan yang telah dilaporkan oleh masyarakat
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ReportsList 
                  reports={reports} 
                  isLoading={isLoading} 
                  isDarkMode={isDarkMode}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Map Tab */}
          <TabsContent value="map">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Peta Kerusakan Jalan
                </CardTitle>
                <CardDescription>
                  Visualisasi lokasi kerusakan jalan pada peta interaktif
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MapView 
                  reports={reports} 
                  isDarkMode={isDarkMode}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Create Report Tab */}
          <TabsContent value="create">
            {user ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PlusCircle className="h-5 w-5" />
                    Laporkan Kerusakan Jalan
                  </CardTitle>
                  <CardDescription>
                    Bantu memperbaiki infrastruktur dengan melaporkan kerusakan jalan yang Anda temukan
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ReportForm 
                    user={user} 
                    onReportCreated={handleReportCreated}
                    isDarkMode={isDarkMode}
                  />
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <PlusCircle className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Login Diperlukan</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Silakan login terlebih dahulu untuk membuat laporan kerusakan jalan
                  </p>
                  <button
                    onClick={() => setIsLoginModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium"
                  >
                    Login Sekarang
                  </button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLogin={handleLogin}
        isDarkMode={isDarkMode}
      />
    </div>
  );
}

export default App;