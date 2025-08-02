# IndoWater Frontend

A modern React/TypeScript frontend for the IndoWater IoT project - a prepaid water meter management system for the Indonesian National Water Authority.

## Features

- **Authentication**: Secure login, registration, and password reset
- **Dashboard**: Overview of meters, balance, and consumption
- **Meter Management**: View meter details, consumption history, and status
- **Payment System**: Top-up prepaid meters and view payment history
- **User Profile**: Manage user information and settings
- **Internationalization**: Support for English and Bahasa Indonesia
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Dark/Light Mode**: User-selectable theme preference

## Technology Stack

- **React**: UI library
- **TypeScript**: Type-safe JavaScript
- **Material UI**: Component library
- **React Router**: Navigation
- **Axios**: API client
- **i18next**: Internationalization
- **Formik & Yup**: Form handling and validation
- **Chart.js**: Data visualization
- **Zustand**: State management
- **Vite**: Build tool

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/indowater-frontend.git
cd indowater-frontend
```

2. Install dependencies
```bash
npm install
# or
yarn
```

3. Start the development server
```bash
npm run dev
# or
yarn dev
```

4. Open your browser and navigate to `http://localhost:12000`

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
```

## Building for Production

```bash
npm run build
# or
yarn build
```

The build artifacts will be stored in the `dist/` directory.

## Project Structure

```
indowater-frontend/
├── public/              # Static assets
├── src/
│   ├── components/      # React components
│   │   ├── Auth/        # Authentication components
│   │   ├── Dashboard/   # Dashboard components
│   │   ├── Layout/      # Layout components
│   │   ├── Meters/      # Meter management components
│   │   ├── Payments/    # Payment components
│   │   ├── Profile/     # User profile components
│   │   └── Settings/    # Settings components
│   ├── contexts/        # React contexts
│   ├── services/        # API services
│   ├── styles/          # Global styles
│   ├── App.tsx          # Main App component
│   └── index.tsx        # Entry point
├── .env                 # Environment variables
├── index.html           # HTML template
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
└── vite.config.ts       # Vite configuration
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Indonesian National Water Authority
- All contributors to the open-source libraries used in this project