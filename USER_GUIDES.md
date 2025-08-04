# IndoWater IoT Smart Monitoring System - User Guides

## Table of Contents

1. [Superadmin User Guide](#superadmin-user-guide)
2. [Client User Guide](#client-user-guide)
3. [Customer User Guide](#customer-user-guide)
4. [Common Features](#common-features)
5. [Mobile App Guide](#mobile-app-guide)
6. [Troubleshooting](#troubleshooting)

---

# Superadmin User Guide

## Overview
As a Superadmin, you have complete access to the IndoWater system, including system configuration, user management, and comprehensive monitoring capabilities.

## Getting Started

### 1. Login
1. Navigate to the admin portal: `https://admin.indowater.com`
2. Enter your superadmin credentials
3. Click "Login"

### 2. Dashboard Overview
The superadmin dashboard provides:
- **System Overview**: Total users, properties, meters, and revenue
- **Performance Metrics**: System health, cache performance, API usage
- **Recent Activities**: Latest system events and user actions
- **Alerts**: System warnings and critical notifications

## Core Functions

### User Management

#### Creating Users
1. Navigate to **Users** → **Add New User**
2. Fill in required information:
   - **Email**: User's email address
   - **Name**: Full name
   - **Role**: Select from superadmin, admin, client, customer
   - **Phone**: Contact number
   - **Address**: Physical address
3. Set initial password or enable email invitation
4. Click **Create User**

#### Managing User Roles
- **Superadmin**: Full system access
- **Admin**: Limited administrative access
- **Client**: Property and customer management
- **Customer**: Personal meter monitoring

#### User Actions
- **View Details**: Click on any user to see complete profile
- **Edit User**: Update user information and permissions
- **Suspend/Activate**: Control user access
- **Reset Password**: Generate new password for users
- **Delete User**: Permanently remove user (use with caution)

### System Configuration

#### General Settings
1. Navigate to **Settings** → **General**
2. Configure:
   - **System Name**: Application branding
   - **Timezone**: Default system timezone
   - **Currency**: Default currency for transactions
   - **Language**: Default system language

#### Payment Gateway Configuration
1. Go to **Settings** → **Payment Gateways**
2. Configure supported gateways:
   - **Midtrans**: Indonesian payment gateway
   - **DOKU**: Alternative payment processor
3. Enter API credentials and test connections

#### Notification Settings
1. Navigate to **Settings** → **Notifications**
2. Configure:
   - **Email Templates**: Customize notification emails
   - **SMS Settings**: Configure SMS provider
   - **WhatsApp Integration**: Set up WhatsApp notifications
   - **Push Notifications**: Mobile app notifications

### Property & Client Management

#### Managing Clients
1. Go to **Clients** section
2. **Add New Client**:
   - Company information
   - Contact details
   - Service agreements
   - Billing preferences
3. **Client Dashboard**: Monitor client performance and usage

#### Property Oversight
- **View All Properties**: System-wide property listing
- **Property Analytics**: Usage patterns and performance
- **Maintenance Scheduling**: System-wide maintenance planning

### Meter Management

#### System-wide Meter Monitoring
1. Navigate to **Meters** → **All Meters**
2. Use filters:
   - **Status**: Active, inactive, maintenance, error
   - **Property**: Filter by specific properties
   - **Client**: Filter by client
   - **Date Range**: Installation or last activity dates

#### Bulk Operations
- **Bulk Updates**: Update multiple meters simultaneously
- **Mass Configuration**: Apply settings to meter groups
- **Batch Maintenance**: Schedule maintenance for multiple meters

#### OTA (Over-The-Air) Updates
1. Go to **Meters** → **OTA Management**
2. **Upload Firmware**: Add new firmware versions
3. **Schedule Updates**: Plan deployment schedules
4. **Monitor Progress**: Track update status across meters

### Financial Management

#### Revenue Monitoring
1. Navigate to **Reports** → **Revenue**
2. View metrics:
   - **Total Revenue**: System-wide earnings
   - **Revenue by Client**: Client contribution analysis
   - **Payment Methods**: Transaction breakdown
   - **Trends**: Historical revenue patterns

#### Service Fee Management
1. Go to **Settings** → **Service Fees**
2. Configure:
   - **Transaction Fees**: Payment processing fees
   - **Maintenance Fees**: Regular service charges
   - **Late Payment Fees**: Penalty charges
   - **Custom Fees**: Client-specific charges

### System Monitoring

#### Performance Dashboard
1. Navigate to **System** → **Performance**
2. Monitor:
   - **API Response Times**: System performance metrics
   - **Database Performance**: Query execution times
   - **Cache Hit Rates**: Caching effectiveness
   - **Error Rates**: System stability indicators

#### Cache Management
1. Go to **System** → **Cache Management**
2. Available actions:
   - **View Statistics**: Cache performance metrics
   - **Clear Cache**: Remove all cached data
   - **Clear Patterns**: Remove specific cache patterns
   - **Warm Cache**: Preload frequently accessed data

#### Log Management
1. Navigate to **System** → **Logs**
2. View and filter:
   - **Application Logs**: System events and errors
   - **Access Logs**: User activity tracking
   - **Payment Logs**: Transaction records
   - **Meter Logs**: Device communication logs

### Reporting & Analytics

#### System Reports
1. Go to **Reports** section
2. Available reports:
   - **User Activity**: Login patterns and usage
   - **System Performance**: Technical metrics
   - **Revenue Analysis**: Financial performance
   - **Meter Utilization**: Device usage patterns

#### Custom Reports
1. Navigate to **Reports** → **Custom Reports**
2. **Report Builder**: Create custom analytics
3. **Scheduled Reports**: Automate report generation
4. **Export Options**: PDF, Excel, CSV formats

### Security Management

#### Access Control
1. Go to **Security** → **Access Control**
2. Configure:
   - **IP Restrictions**: Limit access by IP address
   - **Session Management**: Control user sessions
   - **Two-Factor Authentication**: Enhanced security
   - **Password Policies**: Enforce strong passwords

#### Audit Trail
1. Navigate to **Security** → **Audit Trail**
2. Monitor:
   - **User Actions**: Track all user activities
   - **System Changes**: Configuration modifications
   - **Data Access**: Sensitive data access logs
   - **Failed Attempts**: Security breach attempts

---

# Client User Guide

## Overview
As a Client, you manage properties, customers, and meters within your assigned portfolio. You have comprehensive control over your business operations while working within the IndoWater ecosystem.

## Getting Started

### 1. Initial Setup
1. Receive login credentials from your system administrator
2. Access the client portal: `https://client.indowater.com`
3. Complete your profile setup
4. Configure your property portfolio

### 2. Dashboard Overview
Your dashboard displays:
- **Property Summary**: Total properties and units
- **Customer Overview**: Active customers and accounts
- **Meter Status**: Active, inactive, and maintenance meters
- **Revenue Metrics**: Income and payment statistics
- **Recent Activities**: Latest customer and meter activities

## Property Management

### Adding Properties
1. Navigate to **Properties** → **Add New Property**
2. Enter property details:
   - **Property Name**: Descriptive name
   - **Address**: Complete address information
   - **Property Type**: Residential, commercial, or industrial
   - **Total Units**: Number of units/apartments
   - **Contact Information**: Property manager details

### Property Configuration
1. Select a property from your list
2. Configure:
   - **Tariff Structure**: Pricing for water usage
   - **Service Fees**: Additional charges
   - **Billing Cycle**: Monthly, quarterly, or custom
   - **Payment Methods**: Accepted payment options

### Property Analytics
- **Usage Patterns**: Water consumption trends
- **Revenue Analysis**: Income from each property
- **Customer Satisfaction**: Feedback and ratings
- **Maintenance History**: Service records

## Customer Management

### Customer Registration
1. Go to **Customers** → **Add New Customer**
2. Collect customer information:
   - **Personal Details**: Name, contact information
   - **Unit Assignment**: Specific unit/apartment
   - **Account Preferences**: Billing and notification settings
   - **Initial Credit**: Starting balance for prepaid meters

### Customer Services
- **Account Management**: Update customer information
- **Credit Management**: Add or adjust account credits
- **Payment History**: View transaction records
- **Support Tickets**: Handle customer inquiries

### Communication Tools
1. **Bulk Notifications**: Send messages to multiple customers
2. **Payment Reminders**: Automated low balance alerts
3. **Maintenance Notices**: Service interruption notifications
4. **Promotional Messages**: Special offers and updates

## Meter Operations

### Meter Installation
1. Navigate to **Meters** → **Add New Meter**
2. Enter meter details:
   - **Meter ID**: Unique identifier
   - **Serial Number**: Device serial number
   - **Customer Assignment**: Link to customer account
   - **Installation Date**: Setup date
   - **Initial Reading**: Starting meter reading

### Meter Monitoring
- **Real-time Status**: Current meter conditions
- **Consumption Tracking**: Usage patterns and trends
- **Balance Monitoring**: Credit levels and alerts
- **Maintenance Scheduling**: Preventive maintenance

### Meter Control
1. **Remote Control**: Start/stop water flow
2. **Credit Management**: Add credits to customer accounts
3. **Tariff Application**: Apply pricing changes
4. **Firmware Updates**: Keep meters updated

## Financial Management

### Revenue Tracking
1. Go to **Finance** → **Revenue Reports**
2. Monitor:
   - **Daily Revenue**: Daily income tracking
   - **Monthly Summaries**: Comprehensive monthly reports
   - **Payment Methods**: Revenue by payment type
   - **Outstanding Balances**: Unpaid amounts

### Billing Management
- **Invoice Generation**: Create customer bills
- **Payment Processing**: Handle customer payments
- **Credit Adjustments**: Modify account balances
- **Refund Processing**: Handle customer refunds

### Financial Reports
1. **Profit & Loss**: Income and expense analysis
2. **Cash Flow**: Money movement tracking
3. **Customer Aging**: Outstanding payment analysis
4. **Tax Reports**: Tax-related financial data

## Customer Support

### Support Ticket System
1. Navigate to **Support** → **Tickets**
2. **Create Tickets**: Log customer issues
3. **Track Progress**: Monitor resolution status
4. **Customer Communication**: Update customers on progress

### Common Issues
- **Low Balance Alerts**: Help customers add credits
- **Meter Malfunctions**: Coordinate technical support
- **Billing Disputes**: Resolve payment issues
- **Service Interruptions**: Manage maintenance communications

### Knowledge Base
- **FAQ Management**: Maintain frequently asked questions
- **Troubleshooting Guides**: Step-by-step problem resolution
- **Video Tutorials**: Visual guidance for customers
- **Contact Information**: Support contact details

## Reporting & Analytics

### Standard Reports
1. **Customer Reports**: Customer activity and satisfaction
2. **Usage Reports**: Water consumption analysis
3. **Revenue Reports**: Financial performance
4. **Maintenance Reports**: Service and repair tracking

### Custom Analytics
- **Consumption Patterns**: Identify usage trends
- **Revenue Optimization**: Maximize income opportunities
- **Customer Segmentation**: Group customers by behavior
- **Predictive Analytics**: Forecast future needs

---

# Customer User Guide

## Overview
As a Customer, you can monitor your water usage, manage your account balance, view consumption history, and handle payments through the IndoWater system.

## Getting Started

### 1. Account Access
1. Receive login credentials from your property manager
2. Access the customer portal: `https://customer.indowater.com`
3. Or download the mobile app: "IndoWater Customer"
4. Complete your profile setup

### 2. Dashboard Overview
Your dashboard shows:
- **Current Balance**: Available credit amount
- **Today's Usage**: Water consumption today
- **Monthly Summary**: Current month's usage and costs
- **Meter Status**: Your meter's current condition
- **Recent Transactions**: Latest payments and usage

## Account Management

### Profile Settings
1. Navigate to **Profile** → **Personal Information**
2. Update:
   - **Contact Information**: Phone and email
   - **Address Details**: Verify unit/apartment information
   - **Notification Preferences**: How you want to receive alerts
   - **Language Settings**: Choose your preferred language

### Password & Security
- **Change Password**: Update your login password
- **Two-Factor Authentication**: Enable additional security
- **Login History**: View recent account access
- **Security Alerts**: Receive notifications of suspicious activity

## Balance & Credit Management

### Checking Your Balance
- **Current Balance**: Available credit amount
- **Balance History**: Track balance changes over time
- **Low Balance Alerts**: Automatic notifications when credit is low
- **Projected Usage**: Estimated days remaining based on usage patterns

### Adding Credits
1. Go to **Balance** → **Add Credit**
2. Choose payment method:
   - **Credit/Debit Card**: Instant payment processing
   - **Bank Transfer**: Manual transfer with confirmation
   - **Digital Wallets**: GoPay, OVO, DANA, etc.
   - **Convenience Stores**: Alfamart, Indomaret payments
3. Select credit amount or enter custom amount
4. Complete payment process

### Auto Top-up
1. Navigate to **Balance** → **Auto Top-up**
2. Configure:
   - **Trigger Amount**: Balance level that triggers auto top-up
   - **Top-up Amount**: How much credit to add
   - **Payment Method**: Default payment source
   - **Maximum Frequency**: Limit auto top-ups per month

## Usage Monitoring

### Real-time Usage
- **Current Flow Rate**: Live water usage
- **Today's Consumption**: Water used today
- **Hourly Breakdown**: Usage patterns throughout the day
- **Cost Tracking**: Real-time cost calculation

### Historical Data
1. Go to **Usage** → **History**
2. View data by:
   - **Daily**: Day-by-day consumption
   - **Weekly**: Weekly usage patterns
   - **Monthly**: Monthly summaries
   - **Custom Range**: Specific date ranges

### Usage Analytics
- **Consumption Trends**: Identify usage patterns
- **Cost Analysis**: Track spending over time
- **Comparison Tools**: Compare with previous periods
- **Efficiency Tips**: Suggestions for water conservation

## Payment Management

### Payment History
1. Navigate to **Payments** → **Transaction History**
2. View:
   - **Payment Date**: When payment was made
   - **Amount**: Payment amount
   - **Method**: How payment was processed
   - **Status**: Payment confirmation status
   - **Receipt**: Download payment receipts

### Payment Methods
- **Saved Cards**: Store credit/debit cards securely
- **Bank Accounts**: Link bank accounts for transfers
- **Digital Wallets**: Connect e-wallet accounts
- **Payment Preferences**: Set default payment methods

### Recurring Payments
1. Go to **Payments** → **Recurring Payments**
2. Set up:
   - **Auto-pay**: Automatic balance top-ups
   - **Scheduled Payments**: Regular payment schedules
   - **Payment Limits**: Maximum payment amounts
   - **Notification Settings**: Payment confirmations

## Notifications & Alerts

### Alert Types
- **Low Balance**: When credit is running low
- **Usage Alerts**: High consumption warnings
- **Payment Confirmations**: Successful payment notifications
- **System Maintenance**: Service interruption notices
- **Promotional Offers**: Special deals and discounts

### Notification Preferences
1. Navigate to **Settings** → **Notifications**
2. Configure:
   - **Email Notifications**: Receive alerts via email
   - **SMS Alerts**: Text message notifications
   - **Push Notifications**: Mobile app alerts
   - **WhatsApp Messages**: WhatsApp notifications

## Support & Help

### Getting Help
1. **Help Center**: Access frequently asked questions
2. **Live Chat**: Real-time support during business hours
3. **Support Tickets**: Submit detailed support requests
4. **Phone Support**: Call customer service hotline

### Common Issues
- **Low Balance**: How to add credits quickly
- **High Usage**: Understanding unusual consumption
- **Payment Problems**: Resolving payment failures
- **Account Access**: Password reset and login issues

### Self-Service Tools
- **Meter Reading**: Verify your meter readings
- **Usage Calculator**: Estimate future consumption
- **Bill Estimator**: Predict upcoming costs
- **Conservation Tips**: Reduce water usage

---

# Common Features

## Mobile App Features

### Download & Installation
- **Android**: Google Play Store - "IndoWater Customer"
- **iOS**: App Store - "IndoWater Customer"
- **System Requirements**: Android 6.0+ or iOS 12.0+

### Key Mobile Features
- **Real-time Balance**: Check credit instantly
- **Quick Top-up**: Fast payment processing
- **Usage Alerts**: Push notifications for important updates
- **Offline Mode**: View cached data without internet
- **Biometric Login**: Fingerprint and face recognition

### Mobile-Specific Functions
- **QR Code Payments**: Scan to pay at partner locations
- **Location Services**: Find nearby payment centers
- **Camera Integration**: Scan meter readings
- **Voice Commands**: Voice-activated balance checks

## Multi-language Support

### Supported Languages
- **Indonesian (Bahasa Indonesia)**: Default language
- **English**: International users
- **Javanese**: Regional language support
- **Sundanese**: Regional language support

### Language Settings
1. Go to **Settings** → **Language**
2. Select preferred language
3. Restart application for full language change

## Accessibility Features

### Visual Accessibility
- **High Contrast Mode**: Enhanced visibility
- **Large Text**: Increased font sizes
- **Color Blind Support**: Alternative color schemes
- **Screen Reader**: Compatible with accessibility tools

### Motor Accessibility
- **Voice Navigation**: Voice-controlled interface
- **Gesture Controls**: Simplified touch interactions
- **Keyboard Navigation**: Full keyboard support
- **Switch Control**: External switch compatibility

---

# Troubleshooting

## Common Issues & Solutions

### Login Problems

#### "Invalid Credentials" Error
1. **Check Email**: Ensure correct email address
2. **Verify Password**: Use correct password (case-sensitive)
3. **Clear Browser Cache**: Remove stored login data
4. **Try Different Browser**: Test with alternative browser
5. **Contact Support**: If issue persists

#### "Account Locked" Message
1. **Wait Period**: Account unlocks after 30 minutes
2. **Password Reset**: Use "Forgot Password" option
3. **Contact Administrator**: For immediate unlock
4. **Security Check**: Verify account security

### Balance & Payment Issues

#### Payment Not Reflected
1. **Check Transaction Status**: Verify payment completion
2. **Wait for Processing**: Allow 5-10 minutes for processing
3. **Check Payment Method**: Ensure sufficient funds
4. **Contact Bank**: Verify transaction on bank side
5. **Submit Support Ticket**: If payment confirmed but not credited

#### Auto Top-up Not Working
1. **Check Payment Method**: Verify card/account validity
2. **Review Settings**: Confirm auto top-up configuration
3. **Balance Threshold**: Ensure trigger amount is correct
4. **Payment Limits**: Check daily/monthly limits
5. **Update Payment Info**: Refresh expired payment methods

### Usage & Meter Issues

#### Meter Reading Discrepancies
1. **Manual Reading**: Compare with physical meter
2. **Check Connections**: Ensure meter connectivity
3. **Report Issue**: Submit meter malfunction report
4. **Temporary Reading**: Use manual readings if needed
5. **Technical Support**: Schedule meter inspection

#### High Usage Alerts
1. **Check for Leaks**: Inspect pipes and fixtures
2. **Review Usage Patterns**: Compare with historical data
3. **Verify Meter Accuracy**: Request meter calibration
4. **Usage Analysis**: Identify consumption sources
5. **Conservation Measures**: Implement water-saving practices

### Technical Issues

#### App Crashes or Freezes
1. **Restart App**: Close and reopen application
2. **Update App**: Install latest version
3. **Restart Device**: Reboot phone/tablet
4. **Clear App Data**: Reset app to default settings
5. **Reinstall App**: Remove and reinstall application

#### Slow Performance
1. **Check Internet**: Verify connection speed
2. **Close Other Apps**: Free up device memory
3. **Clear Cache**: Remove temporary files
4. **Update Device**: Install system updates
5. **Contact Support**: Report persistent issues

## Emergency Contacts

### 24/7 Emergency Hotline
- **Phone**: +62-21-XXXX-XXXX
- **WhatsApp**: +62-8XX-XXXX-XXXX
- **Email**: emergency@indowater.com

### Business Hours Support
- **Monday-Friday**: 8:00 AM - 6:00 PM WIB
- **Saturday**: 9:00 AM - 3:00 PM WIB
- **Sunday**: Closed (Emergency only)

### Online Support
- **Live Chat**: Available during business hours
- **Support Portal**: https://support.indowater.com
- **Knowledge Base**: https://help.indowater.com
- **Video Tutorials**: https://tutorials.indowater.com

---

*This user guide is regularly updated. For the latest version, visit our documentation portal or contact customer support.*