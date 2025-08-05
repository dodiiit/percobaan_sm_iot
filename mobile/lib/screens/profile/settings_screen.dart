import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/theme_provider.dart';
import '../../providers/language_provider.dart';
import '../../utils/constants.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: const Text('Settings'),
        backgroundColor: Constants.waterPrimary,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // Appearance Settings
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(Constants.borderRadiusLarge),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 10,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Text(
                      'Appearance',
                      style: Constants.subheadingStyle.copyWith(
                        color: Colors.black87,
                      ),
                    ),
                  ),
                  Consumer<ThemeProvider>(
                    builder: (context, themeProvider, child) {
                      return Column(
                        children: [
                          _buildSettingTile(
                            icon: Icons.brightness_6_outlined,
                            title: 'Theme',
                            subtitle: _getThemeModeText(themeProvider.themeMode),
                            onTap: () => _showThemeDialog(context, themeProvider),
                          ),
                          _buildDivider(),
                          SwitchListTile(
                            secondary: const Icon(Icons.dark_mode_outlined),
                            title: const Text('Dark Mode'),
                            subtitle: const Text('Use dark theme'),
                            value: themeProvider.isDarkMode,
                            onChanged: (value) {
                              themeProvider.setThemeMode(
                                value ? ThemeMode.dark : ThemeMode.light,
                              );
                            },
                            activeColor: Constants.waterPrimary,
                          ),
                        ],
                      );
                    },
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: 16),
            
            // Language Settings
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(Constants.borderRadiusLarge),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 10,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Text(
                      'Language & Region',
                      style: Constants.subheadingStyle.copyWith(
                        color: Colors.black87,
                      ),
                    ),
                  ),
                  Consumer<LanguageProvider>(
                    builder: (context, languageProvider, child) {
                      return _buildSettingTile(
                        icon: Icons.language_outlined,
                        title: 'Language',
                        subtitle: _getLanguageText(languageProvider.locale),
                        onTap: () => _showLanguageDialog(context, languageProvider),
                      );
                    },
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: 16),
            
            // Notification Settings
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(Constants.borderRadiusLarge),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 10,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Text(
                      'Notifications',
                      style: Constants.subheadingStyle.copyWith(
                        color: Colors.black87,
                      ),
                    ),
                  ),
                  SwitchListTile(
                    secondary: const Icon(Icons.notifications_outlined),
                    title: const Text('Push Notifications'),
                    subtitle: const Text('Receive push notifications'),
                    value: true, // TODO: Connect to actual setting
                    onChanged: (value) {
                      // TODO: Implement notification toggle
                    },
                    activeColor: Constants.waterPrimary,
                  ),
                  _buildDivider(),
                  SwitchListTile(
                    secondary: const Icon(Icons.water_drop_outlined),
                    title: const Text('Low Balance Alerts'),
                    subtitle: const Text('Alert when balance is low'),
                    value: true, // TODO: Connect to actual setting
                    onChanged: (value) {
                      // TODO: Implement low balance alert toggle
                    },
                    activeColor: Constants.waterPrimary,
                  ),
                  _buildDivider(),
                  SwitchListTile(
                    secondary: const Icon(Icons.offline_bolt_outlined),
                    title: const Text('Meter Offline Alerts'),
                    subtitle: const Text('Alert when meter goes offline'),
                    value: true, // TODO: Connect to actual setting
                    onChanged: (value) {
                      // TODO: Implement offline alert toggle
                    },
                    activeColor: Constants.waterPrimary,
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: 16),
            
            // Data & Storage Settings
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(Constants.borderRadiusLarge),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 10,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Text(
                      'Data & Storage',
                      style: Constants.subheadingStyle.copyWith(
                        color: Colors.black87,
                      ),
                    ),
                  ),
                  _buildSettingTile(
                    icon: Icons.storage_outlined,
                    title: 'Clear Cache',
                    subtitle: 'Free up storage space',
                    onTap: () => _showClearCacheDialog(context),
                  ),
                  _buildDivider(),
                  SwitchListTile(
                    secondary: const Icon(Icons.cloud_sync_outlined),
                    title: const Text('Auto Sync'),
                    subtitle: const Text('Automatically sync data'),
                    value: true, // TODO: Connect to actual setting
                    onChanged: (value) {
                      // TODO: Implement auto sync toggle
                    },
                    activeColor: Constants.waterPrimary,
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: 16),
            
            // About Settings
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(Constants.borderRadiusLarge),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 10,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Text(
                      'About',
                      style: Constants.subheadingStyle.copyWith(
                        color: Colors.black87,
                      ),
                    ),
                  ),
                  _buildSettingTile(
                    icon: Icons.info_outline,
                    title: 'App Version',
                    subtitle: Constants.appVersion,
                    onTap: () {},
                  ),
                  _buildDivider(),
                  _buildSettingTile(
                    icon: Icons.privacy_tip_outlined,
                    title: 'Privacy Policy',
                    subtitle: 'Read our privacy policy',
                    onTap: () {
                      // TODO: Open privacy policy
                    },
                  ),
                  _buildDivider(),
                  _buildSettingTile(
                    icon: Icons.description_outlined,
                    title: 'Terms of Service',
                    subtitle: 'Read our terms of service',
                    onTap: () {
                      // TODO: Open terms of service
                    },
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }
  
  Widget _buildSettingTile({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return ListTile(
      leading: Icon(icon, color: Constants.waterPrimary),
      title: Text(title),
      subtitle: Text(subtitle),
      trailing: const Icon(Icons.arrow_forward_ios, size: 16),
      onTap: onTap,
    );
  }
  
  Widget _buildDivider() {
    return Divider(
      height: 1,
      thickness: 1,
      color: Colors.grey[200],
      indent: 16,
      endIndent: 16,
    );
  }
  
  String _getThemeModeText(ThemeMode themeMode) {
    switch (themeMode) {
      case ThemeMode.light:
        return 'Light';
      case ThemeMode.dark:
        return 'Dark';
      case ThemeMode.system:
        return 'System';
    }
  }
  
  String _getLanguageText(Locale locale) {
    switch (locale.languageCode) {
      case 'en':
        return 'English';
      case 'id':
        return 'Bahasa Indonesia';
      default:
        return 'English';
    }
  }
  
  void _showThemeDialog(BuildContext context, ThemeProvider themeProvider) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Choose Theme'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              RadioListTile<ThemeMode>(
                title: const Text('Light'),
                value: ThemeMode.light,
                groupValue: themeProvider.themeMode,
                onChanged: (ThemeMode? value) {
                  if (value != null) {
                    themeProvider.setThemeMode(value);
                    Navigator.of(context).pop();
                  }
                },
                activeColor: Constants.waterPrimary,
              ),
              RadioListTile<ThemeMode>(
                title: const Text('Dark'),
                value: ThemeMode.dark,
                groupValue: themeProvider.themeMode,
                onChanged: (ThemeMode? value) {
                  if (value != null) {
                    themeProvider.setThemeMode(value);
                    Navigator.of(context).pop();
                  }
                },
                activeColor: Constants.waterPrimary,
              ),
              RadioListTile<ThemeMode>(
                title: const Text('System'),
                value: ThemeMode.system,
                groupValue: themeProvider.themeMode,
                onChanged: (ThemeMode? value) {
                  if (value != null) {
                    themeProvider.setThemeMode(value);
                    Navigator.of(context).pop();
                  }
                },
                activeColor: Constants.waterPrimary,
              ),
            ],
          ),
        );
      },
    );
  }
  
  void _showLanguageDialog(BuildContext context, LanguageProvider languageProvider) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Choose Language'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              RadioListTile<Locale>(
                title: const Text('English'),
                value: const Locale('en'),
                groupValue: languageProvider.locale,
                onChanged: (Locale? value) {
                  if (value != null) {
                    languageProvider.setLocale(value);
                    Navigator.of(context).pop();
                  }
                },
                activeColor: Constants.waterPrimary,
              ),
              RadioListTile<Locale>(
                title: const Text('Bahasa Indonesia'),
                value: const Locale('id'),
                groupValue: languageProvider.locale,
                onChanged: (Locale? value) {
                  if (value != null) {
                    languageProvider.setLocale(value);
                    Navigator.of(context).pop();
                  }
                },
                activeColor: Constants.waterPrimary,
              ),
            ],
          ),
        );
      },
    );
  }
  
  void _showClearCacheDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Clear Cache'),
          content: const Text('This will clear all cached data. Are you sure?'),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () {
                // TODO: Implement cache clearing
                Navigator.of(context).pop();
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Cache cleared successfully'),
                    backgroundColor: Constants.waterSuccess,
                  ),
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Constants.waterPrimary,
                foregroundColor: Colors.white,
              ),
              child: const Text('Clear'),
            ),
          ],
        );
      },
    );
  }
}