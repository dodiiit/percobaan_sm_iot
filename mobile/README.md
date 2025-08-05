# IndoWater Mobile App

A comprehensive Flutter mobile application for managing IoT smart water meters in Indonesia.

## Features

### Core Functionality
- **User Authentication**: Login, registration, password reset, email verification
- **Dashboard**: Real-time water meter monitoring and usage analytics
- **Water Meter Management**: View meter details, usage history, and status
- **Payment System**: Top-up balance with multiple payment methods
- **Notifications**: Real-time alerts for low balance, meter offline, etc.
- **QR Code**: Generate and scan QR codes for meter management
- **Profile Management**: Update user information and preferences
- **Settings**: Theme, language, and notification preferences

### Technical Features
- **Offline Support**: Continue using the app without internet connection
- **Real-time Updates**: Live data synchronization with IoT devices
- **Multi-language**: Support for Indonesian and English
- **Dark/Light Theme**: Adaptive UI themes
- **Push Notifications**: Firebase Cloud Messaging integration
- **Charts & Analytics**: Visual representation of usage data
- **Error Handling**: Comprehensive error management and user feedback

## Architecture

### State Management
- **Provider Pattern**: Used for state management across the app
- **Reactive UI**: Automatic UI updates when data changes
- **Separation of Concerns**: Clear separation between UI, business logic, and data

### Project Structure
```
lib/
├── main.dart                 # App entry point
├── models/                   # Data models
│   ├── user.dart
│   ├── water_meter.dart
│   ├── payment.dart
│   └── notification.dart
├── providers/                # State management
│   ├── auth_provider.dart
│   ├── meter_provider.dart
│   ├── payment_provider.dart
│   ├── notification_provider.dart
│   ├── theme_provider.dart
│   └── language_provider.dart
├── screens/                  # UI screens
│   ├── auth/
│   ├── dashboard/
│   ├── meter/
│   ├── payment/
│   ├── profile/
│   ├── notifications/
│   └── qr/
├── services/                 # Business logic
│   ├── api_service.dart
│   ├── auth_service.dart
│   ├── notification_service.dart
│   └── offline_service.dart
├── utils/                    # Utilities
│   ├── constants.dart
│   ├── formatters.dart
│   └── validators.dart
└── widgets/                  # Reusable widgets
    └── common/
```

## Dependencies

### Core Dependencies
- **flutter**: Framework for building cross-platform apps
- **provider**: State management solution
- **dio**: HTTP client for API communication
- **shared_preferences**: Local data persistence

### UI Dependencies
- **fl_chart**: Charts and graphs
- **pull_to_refresh**: Pull-to-refresh functionality
- **cached_network_image**: Image caching
- **shimmer**: Loading animations

### Functionality Dependencies
- **firebase_core**: Firebase integration
- **firebase_messaging**: Push notifications
- **qr_code_scanner**: QR code scanning
- **qr_flutter**: QR code generation
- **intl**: Internationalization
- **permission_handler**: Device permissions

## Setup Instructions

### Prerequisites
1. Flutter SDK (>=3.0.0)
2. Dart SDK (>=3.0.0)
3. Android Studio / VS Code
4. Android SDK / Xcode (for iOS)

### Installation
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd percobaan_sm_iot/mobile
   ```

2. Install dependencies:
   ```bash
   flutter pub get
   ```

3. Configure Firebase:
   - Create a Firebase project
   - Add Android/iOS apps to the project
   - Download and place configuration files:
     - `android/app/google-services.json` (Android)
     - `ios/Runner/GoogleService-Info.plist` (iOS)

4. Update API configuration:
   - Edit `lib/utils/constants.dart`
   - Set the correct `baseUrl` for your backend API

5. Run the app:
   ```bash
   flutter run
   ```

## Configuration

### API Configuration
Update the API base URL in `lib/utils/constants.dart`:
```dart
class Constants {
  static const String baseUrl = 'https://your-api-domain.com';
  // ... other constants
}
```

### Firebase Configuration
1. Follow the [Firebase setup guide](https://firebase.google.com/docs/flutter/setup)
2. Enable Authentication and Cloud Messaging
3. Configure notification settings in Firebase Console

### Environment Variables
Create a `.env` file in the root directory:
```
API_BASE_URL=https://your-api-domain.com
FIREBASE_PROJECT_ID=your-project-id
```

## Testing

### Unit Tests
Run unit tests:
```bash
flutter test
```

### Integration Tests
Run integration tests:
```bash
flutter test integration_test/
```

### Widget Tests
Test individual widgets:
```bash
flutter test test/widget_test.dart
```

## Building for Production

### Android
1. Configure signing:
   - Create `android/key.properties`
   - Generate keystore file
   - Update `android/app/build.gradle`

2. Build APK:
   ```bash
   flutter build apk --release
   ```

3. Build App Bundle:
   ```bash
   flutter build appbundle --release
   ```

### iOS
1. Configure signing in Xcode
2. Build for iOS:
   ```bash
   flutter build ios --release
   ```

## API Integration

### Authentication
- Login: `POST /api/auth/login`
- Register: `POST /api/auth/register`
- Logout: `POST /api/auth/logout`
- Refresh Token: `POST /api/auth/refresh`

### Water Meters
- Get Meters: `GET /api/water-meters`
- Get Meter Details: `GET /api/water-meters/{id}`
- Get Usage History: `GET /api/water-meters/{id}/usage`

### Payments
- Get Payment Methods: `GET /api/payment-methods`
- Create Payment: `POST /api/payments`
- Get Payment History: `GET /api/payments`
- Check Payment Status: `GET /api/payments/{id}/status`

### Notifications
- Get Notifications: `GET /api/notifications`
- Mark as Read: `PUT /api/notifications/{id}/read`
- Update FCM Token: `POST /api/fcm-token`

## Error Handling

### Network Errors
- Automatic retry for failed requests
- Offline mode with cached data
- User-friendly error messages

### Validation Errors
- Real-time form validation
- Clear error indicators
- Helpful error messages

### API Errors
- Structured error responses
- Error code mapping
- Fallback mechanisms

## Performance Optimization

### Image Optimization
- Cached network images
- Lazy loading
- Optimized image sizes

### Data Management
- Efficient state management
- Minimal API calls
- Smart caching strategies

### UI Performance
- Optimized widget rebuilds
- Efficient list rendering
- Smooth animations

## Security

### Data Protection
- Secure token storage
- API request encryption
- Sensitive data handling

### Authentication
- JWT token management
- Automatic token refresh
- Secure logout

### Permissions
- Minimal permission requests
- Runtime permission handling
- User consent management

## Troubleshooting

### Common Issues

1. **Build Errors**
   - Clean and rebuild: `flutter clean && flutter pub get`
   - Check Flutter version compatibility
   - Verify dependency versions

2. **API Connection Issues**
   - Verify API URL configuration
   - Check network connectivity
   - Validate API endpoints

3. **Firebase Issues**
   - Verify configuration files
   - Check Firebase project settings
   - Validate package names

4. **Permission Issues**
   - Check Android/iOS permissions
   - Verify permission handling code
   - Test on different devices

### Debug Mode
Enable debug logging in `lib/utils/constants.dart`:
```dart
static const bool isDebugMode = true;
```

## Contributing

### Code Style
- Follow Dart style guidelines
- Use meaningful variable names
- Add comments for complex logic
- Maintain consistent formatting

### Pull Requests
1. Create feature branch
2. Implement changes
3. Add tests
4. Update documentation
5. Submit pull request

### Testing Requirements
- Unit tests for business logic
- Widget tests for UI components
- Integration tests for user flows
- Minimum 80% code coverage

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Email: support@indowater.com
- Documentation: https://docs.indowater.com
- Issues: GitHub Issues page

## Changelog

### Version 1.0.0
- Initial release
- Core water meter management features
- Payment system integration
- Real-time notifications
- Multi-language support
- Dark/light theme support

### Version 1.1.0 (Planned)
- Enhanced analytics dashboard
- Offline data synchronization
- Advanced notification settings
- Performance improvements
- Bug fixes and optimizations