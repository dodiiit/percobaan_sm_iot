import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme, Theme, PaletteMode } from '@mui/material';

interface ThemeContextType {
  mode: PaletteMode;
  isDark: boolean;
  toggleTheme: () => void;
  theme: Theme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Define theme colors
const getTheme = (mode: PaletteMode) => createTheme({
  palette: {
    mode,
    primary: {
      main: '#0288d1', // Light blue for water theme
      light: '#5eb8ff',
      dark: '#005b9f',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#00acc1', // Cyan for water theme
      light: '#5ddef4',
      dark: '#007c91',
      contrastText: '#ffffff',
    },
    background: {
      default: mode === 'light' ? '#f5f5f5' : '#121212',
      paper: mode === 'light' ? '#ffffff' : '#1e1e1e',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 500,
    },
    h2: {
      fontWeight: 500,
    },
    h3: {
      fontWeight: 500,
    },
    h4: {
      fontWeight: 500,
    },
    h5: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: mode === 'light' 
            ? '0px 2px 4px rgba(0, 0, 0, 0.05), 0px 4px 6px rgba(0, 0, 0, 0.05)' 
            : '0px 2px 4px rgba(0, 0, 0, 0.2), 0px 4px 6px rgba(0, 0, 0, 0.2)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)',
        },
      },
    },
  },
});

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [mode, setMode] = useState<PaletteMode>('light');
  const [theme, setTheme] = useState<Theme>(getTheme(mode));

  useEffect(() => {
    const savedMode = localStorage.getItem('theme') as PaletteMode | null;
    if (savedMode) {
      setMode(savedMode);
      setTheme(getTheme(savedMode));
      // Update document class for Tailwind dark mode
      if (savedMode === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, []);

  const toggleTheme = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    setTheme(getTheme(newMode));
    localStorage.setItem('theme', newMode);
    
    // Update document class for Tailwind dark mode
    if (newMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const value = {
    mode,
    isDark: mode === 'dark',
    toggleTheme,
    theme,
  };

  return (
    <ThemeContext.Provider value={value}>
      <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>
    </ThemeContext.Provider>
  );
};