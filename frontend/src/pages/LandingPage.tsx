import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Droplets, 
  Shield, 
  Smartphone, 
  BarChart3, 
  Zap, 
  Users, 
  CheckCircle, 
  ArrowRight,
  Play,
  Star,
  Award,
  Globe,
  Clock,
  TrendingUp,
  Wifi,
  Battery,
  Settings,
  Moon,
  Sun
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const LandingPage: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();

  const features = [
    {
      icon: Droplets,
      title: 'Meteran Air Prabayar IoT',
      description: 'Sistem meteran air pintar dengan teknologi IoT yang memungkinkan monitoring real-time dan pembayaran prabayar.',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Shield,
      title: 'Keamanan Tingkat Tinggi',
      description: 'Dilengkapi dengan sistem anti-tamper, enkripsi data, dan monitoring keamanan 24/7.',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: Smartphone,
      title: 'Aplikasi Mobile Friendly',
      description: 'Interface yang responsif dan mudah digunakan di berbagai perangkat mobile dan desktop.',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: BarChart3,
      title: 'Analytics & Reporting',
      description: 'Dashboard analitik lengkap dengan laporan konsumsi, transaksi, dan performa sistem.',
      color: 'from-orange-500 to-red-500'
    },
    {
      icon: Zap,
      title: 'Real-time Monitoring',
      description: 'Monitoring status perangkat, debit air, dan saldo secara real-time dengan notifikasi otomatis.',
      color: 'from-yellow-500 to-orange-500'
    },
    {
      icon: Users,
      title: 'Multi-Role Management',
      description: 'Sistem manajemen pengguna dengan berbagai role: Admin, Operator, Teknisi, dan Pelanggan.',
      color: 'from-indigo-500 to-purple-500'
    }
  ];

  const stats = [
    { number: '10,000+', label: 'Meteran Terpasang', icon: Droplets },
    { number: '50+', label: 'Kota Terjangkau', icon: Globe },
    { number: '99.9%', label: 'Uptime System', icon: Clock },
    { number: '24/7', label: 'Customer Support', icon: Users }
  ];

  const testimonials = [
    {
      name: 'Budi Santoso',
      role: 'Direktur PT Air Bersih',
      content: 'IndoWater Solution telah mengubah cara kami mengelola distribusi air. Sistem yang sangat efisien dan mudah digunakan.',
      rating: 5,
      avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2'
    },
    {
      name: 'Siti Rahayu',
      role: 'Manager Operasional AirKita',
      content: 'Monitoring real-time dan sistem pembayaran prabayar sangat membantu dalam pengelolaan pelanggan dan keuangan.',
      rating: 5,
      avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2'
    },
    {
      name: 'Ahmad Wijaya',
      role: 'Kepala Teknisi',
      content: 'Aplikasi teknisi sangat memudahkan pekerjaan lapangan. Semua data tersentralisasi dan mudah diakses.',
      rating: 5,
      avatar: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2'
    }
  ];

  const pricingPlans = [
    {
      name: 'Starter',
      price: '2.5',
      unit: 'juta',
      period: '/bulan',
      description: 'Cocok untuk Pengelolaan Air Skala kecil',
      features: [
        'Hingga 1,000 meteran',
        'Dashboard basic',
        'Support email',
        'Laporan bulanan',
        'Mobile app'
      ],
      popular: false
    },
    {
      name: 'Professional',
      price: '5',
      unit: 'juta',
      period: '/bulan',
      description: 'Untuk Pengelolaan Air Skala Menengah',
      features: [
        'Hingga 5,000 meteran',
        'Dashboard advanced',
        'Support 24/7',
        'Laporan real-time',
        'Mobile app',
        'API integration',
        'Custom branding'
      ],
      popular: true
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      unit: '',
      period: '',
      description: 'Solusi enterprise',
      features: [
        'Unlimited meteran',
        'Dashboard enterprise',
        'Dedicated support',
        'Custom features',
        'White-label solution',
        'On-premise deployment',
        'SLA guarantee'
      ],
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      {/* Theme Toggle Button */}
      <button
        onClick={toggleTheme}
        className="fixed top-6 right-6 p-3 rounded-full bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-200 z-50 group"
        title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        {isDark ? (
          <Sun className="h-6 w-6 text-yellow-500 group-hover:text-yellow-400 transition-colors duration-200" />
        ) : (
          <Moon className="h-6 w-6 text-gray-600 group-hover:text-blue-600 transition-colors duration-200" />
        )}
      </button>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 z-40 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-2 rounded-lg">
                <Droplets className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">IndoWater Solution</h1>
                <p className="text-xs text-gray-600 dark:text-gray-400">Mengalirkan Solusi Bukan Sekedar Air</p>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Fitur</a>
              <a href="#testimonials" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Testimoni</a>
              <a href="#contact" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Kontak</a>
              <Link
                to="/login"
                className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 transform hover:scale-105"
              >
                Masuk
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-20 bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight">
                  <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                    IndoWater
                  </span>
                  <br />
                  Solution
                </h1>
                <p className="text-2xl text-blue-600 dark:text-blue-400 font-medium">
                  Mengalirkan Solusi Bukan Sekedar Air
                </p>
                <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
                  Sistem manajemen meteran air prabayar yang revolusioner untuk Pengelolaan Air secara Efisien di berbagai Aspek.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  Mulai Sekarang
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <button className="inline-flex items-center justify-center px-8 py-4 border-2 border-blue-600 text-blue-600 dark:text-blue-400 font-semibold rounded-xl hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white transition-all duration-200">
                  <Play className="mr-2 h-5 w-5" />
                  Lihat Demo
                </button>
              </div>

              <div className="flex items-center space-x-8 pt-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-gray-600 dark:text-gray-400">Setup dalam 24 jam</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-gray-600 dark:text-gray-400">Support 24/7</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="relative z-10 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 transform rotate-3 hover:rotate-0 transition-transform duration-300">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Dashboard Real-time</h3>
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <Droplets className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Debit Air</span>
                      </div>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">2.5 L/min</p>
                    </div>
                    
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <Battery className="h-5 w-5 text-green-600 dark:text-green-400" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Baterai</span>
                      </div>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">98%</p>
                    </div>
                    
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <Wifi className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Koneksi</span>
                      </div>
                      <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">Online</p>
                    </div>
                    
                    <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <Settings className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</span>
                      </div>
                      <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">Aktif</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl transform rotate-6 opacity-20"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl transform -rotate-3 opacity-10"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full mb-4">
                  <stat.icon className="h-8 w-8 text-white" />
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{stat.number}</div>
                <div className="text-gray-600 dark:text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white dark:bg-gray-900 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Fitur Unggulan
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Solusi lengkap untuk manajemen meteran air prabayar dengan teknologi IoT terdepan
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="group relative bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-200 dark:border-gray-700">
                <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r ${feature.color} rounded-xl mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-gray-50 dark:bg-gray-800 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Apa Kata Mereka
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Testimoni dari klien yang telah mempercayai IndoWater Solution
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 dark:text-gray-300 mb-6 italic">"{testimonial.content}"</p>
                <div className="flex items-center space-x-4">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">{testimonial.name}</h4>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-cyan-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Siap Mengalirkan Solusi untuk Perusahaan Anda?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Bergabunglah dengan ratusan perusahaan air yang telah mempercayai IndoWater Solution untuk mengelola sistem distribusi air mereka.
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link
              to="/login"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl hover:bg-gray-100 transition-all duration-200 transform hover:scale-105"
            >
              Mulai Gratis Sekarang
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <button className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white font-semibold rounded-xl hover:bg-white hover:text-blue-600 transition-all duration-200">
              Hubungi Sales
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-gray-900 dark:bg-black text-white py-16 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-2 rounded-lg">
                  <Droplets className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">IndoWater Solution</h3>
                  <p className="text-blue-400">Mengalirkan Solusi Bukan Sekedar Air</p>
                </div>
              </div>
              <p className="text-gray-400 mb-6 max-w-md">
                Solusi terdepan untuk manajemen meteran air prabayar IoT di Indonesia. Menghadirkan teknologi canggih untuk masa depan distribusi air yang lebih efisien.
              </p>
              <div className="flex items-center space-x-4">
                <Award className="h-6 w-6 text-yellow-400" />
                <span className="text-gray-400">ISO 27001 Certified</span>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Produk</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Meteran IoT</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Dashboard Admin</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Mobile App</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API Integration</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Kontak</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Email: info@indowatersolution.com</li>
                <li>Phone: +62 21 1234 5678</li>
                <li>WhatsApp: +62 812 3456 7890</li>
                <li>Jakarta, Indonesia</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400">© 2025 IndoWater Solution. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;