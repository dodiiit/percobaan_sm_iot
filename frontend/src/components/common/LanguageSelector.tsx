import React from 'react';
import { 
  Box, 
  IconButton, 
  Menu, 
  MenuItem, 
  Typography, 
  Tooltip,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import { Translate } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../contexts/LanguageContext';

interface LanguageOption {
  code: string;
  name: string;
  flag: string;
}

const languages: LanguageOption[] = [
  {
    code: 'id',
    name: 'Bahasa Indonesia',
    flag: '🇮🇩'
  },
  {
    code: 'en',
    name: 'English',
    flag: '🇬🇧'
  }
];

interface LanguageSelectorProps {
  variant?: 'icon' | 'text' | 'full';
  color?: string;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ 
  variant = 'icon',
  color = 'inherit'
}) => {
  const { t } = useTranslation();
  const { language, changeLanguage } = useLanguage();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageChange = (code: string) => {
    changeLanguage(code);
    handleClose();
  };

  const currentLanguage = languages.find(lang => lang.code === language) || languages[0];

  return (
    <Box>
      {variant === 'icon' && (
        <Tooltip title={t('settings.language')}>
          <IconButton
            onClick={handleClick}
            size="small"
            aria-controls={open ? 'language-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={open ? 'true' : undefined}
            color={color as any}
          >
            <Translate />
          </IconButton>
        </Tooltip>
      )}

      {variant === 'text' && (
        <Box 
          onClick={handleClick}
          sx={{ 
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            '&:hover': { opacity: 0.8 }
          }}
        >
          <Typography variant="body2" color={color}>
            {currentLanguage.code.toUpperCase()}
          </Typography>
        </Box>
      )}

      {variant === 'full' && (
        <Box 
          onClick={handleClick}
          sx={{ 
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            '&:hover': { opacity: 0.8 }
          }}
        >
          <Typography variant="body2" sx={{ mr: 1 }} color={color}>
            {currentLanguage.flag}
          </Typography>
          <Typography variant="body2" color={color}>
            {currentLanguage.name}
          </Typography>
        </Box>
      )}

      <Menu
        anchorEl={anchorEl}
        id="language-menu"
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {languages.map((lang) => (
          <MenuItem 
            key={lang.code} 
            onClick={() => handleLanguageChange(lang.code)}
            selected={lang.code === language}
          >
            <ListItemIcon sx={{ minWidth: '30px' }}>
              <Typography variant="body2">{lang.flag}</Typography>
            </ListItemIcon>
            <ListItemText>{lang.name}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};

export default LanguageSelector;