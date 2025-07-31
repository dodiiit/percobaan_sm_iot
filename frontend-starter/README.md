# IndoWater Customer Dashboard - Frontend Starter

This is a React frontend starter template for the IndoWater IoT project customer dashboard.

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn
- IndoWater API running on localhost:8000

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:3000`

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Dashboard.jsx   # Main dashboard component (example)
│   ├── Auth/           # Authentication components
│   ├── Balance/        # Balance management components
│   ├── Consumption/    # Consumption tracking components
│   └── Profile/        # User profile components
├── services/           # API services
│   ├── api.js         # Main API client with auth
│   ├── auth.js        # Authentication service
│   └── websocket.js   # Real-time communication
├── pages/             # Page components
├── utils/             # Utility functions
└── App.jsx           # Main application component
```

## 🔧 API Integration

The starter includes a complete API client (`src/services/api.js`) with:

- ✅ **Authentication handling** (JWT tokens, refresh)
- ✅ **Automatic token refresh** on 401 errors
- ✅ **Request/response interceptors**
- ✅ **All API endpoints** pre-configured

### Example Usage

```javascript
import { meterAPI, authAPI } from '../services/api';

// Login
const response = await authAPI.login({
  email: 'customer1@indowater.com',
  password: 'customer123'
});

// Get meter balance
const balance = await meterAPI.getBalance(meterId);

// Top up meter
await meterAPI.topup(meterId, 100000, 'Manual top-up');
```

## 🎨 UI Components

Built with Material-UI for consistent design:

- **Dashboard**: Overview with balance, consumption, meters
- **Authentication**: Login, register, password reset
- **Balance Management**: Real-time balance, top-up interface
- **Consumption Analytics**: Charts and historical data
- **Profile Management**: User settings and preferences

## 📡 Real-time Features

### Server-Sent Events (SSE)

```javascript
// Real-time meter data
const eventSource = new EventSource('/api/realtime/stream/meters');
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  updateMeterData(data);
};

// Real-time notifications
const notificationSource = new EventSource('/api/realtime/stream/notifications');
notificationSource.onmessage = (event) => {
  const notification = JSON.parse(event.data);
  showNotification(notification);
};
```

### Polling Alternative

```javascript
import { realtimeAPI } from '../services/api';

// Poll for updates every 5 seconds
setInterval(async () => {
  const updates = await realtimeAPI.getMeterUpdates(meterId);
  updateUI(updates.data);
}, 5000);
```

## 🔐 Authentication Flow

1. **Login**: User enters credentials
2. **Token Storage**: JWT tokens stored in localStorage
3. **Auto-refresh**: Expired tokens automatically refreshed
4. **Logout**: Tokens cleared, redirect to login

### Protected Routes

```javascript
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('access_token');
  return token ? children : <Navigate to="/login" />;
};
```

## 📊 Dashboard Features

The example Dashboard component includes:

- **Balance Overview**: Total balance across all meters
- **Meter Management**: List of user's meters with status
- **Recent Payments**: Payment history
- **Usage Statistics**: Monthly consumption data
- **Real-time Updates**: Live meter status

## 🎯 Next Steps

### Required Pages to Build

1. **Authentication Pages**
   - Login (`/login`)
   - Register (`/register`)
   - Forgot Password (`/forgot-password`)
   - Reset Password (`/reset-password`)

2. **Main Application**
   - Dashboard (`/dashboard`)
   - Balance Management (`/balance`)
   - Consumption Analytics (`/consumption`)
   - Payment History (`/payments`)
   - Profile Settings (`/profile`)

3. **Meter Management**
   - Meter Details (`/meters/:id`)
   - Top-up Interface (`/meters/:id/topup`)
   - Consumption History (`/meters/:id/consumption`)

### Recommended Libraries

```bash
# Charts and data visualization
npm install recharts @mui/x-charts

# Form handling
npm install react-hook-form @hookform/resolvers yup

# Date handling
npm install date-fns

# Real-time communication
npm install socket.io-client

# State management (optional)
npm install zustand # or redux-toolkit
```

## 🔧 Development Tips

### Environment Variables

Create `.env` file:
```
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
```

### API Testing

Use the provided test credentials:
- **Customer**: customer1@indowater.com / customer123
- **Client**: client1@indowater.com / client123
- **Admin**: admin@indowater.com / admin123

### Proxy Configuration

The Vite config includes API proxy to avoid CORS issues during development.

## 🚀 Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## 📱 Mobile Responsiveness

The starter uses Material-UI's responsive grid system and breakpoints for mobile-first design.

## 🧪 Testing

Add testing libraries:
```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom vitest
```

## 📚 Additional Resources

- [Material-UI Documentation](https://mui.com/)
- [React Router Documentation](https://reactrouter.com/)
- [Vite Documentation](https://vitejs.dev/)
- [IndoWater API Documentation](../API_DOCUMENTATION.md)

## 🤝 Contributing

1. Follow the existing code structure
2. Use Material-UI components consistently
3. Handle loading and error states
4. Add proper TypeScript types (if using TS)
5. Test API integration thoroughly

The backend API is fully functional and ready for integration!