<?php

declare(strict_types=1);

namespace IndoWater\Api\Services;

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

class EmailService
{
    private array $config;

    public function __construct(array $config)
    {
        $this->config = $config;
    }

    public function sendVerificationEmail(string $email, string $name, string $token): bool
    {
        $subject = 'Verify Your Email Address - IndoWater';
        $verificationUrl = $this->config['app_url'] . "/verify-email/{$token}";
        
        $body = $this->getEmailTemplate('verification', [
            'name' => $name,
            'verification_url' => $verificationUrl
        ]);

        return $this->sendEmail($email, $name, $subject, $body);
    }

    public function sendPasswordResetEmail(string $email, string $token): bool
    {
        $subject = 'Reset Your Password - IndoWater';
        $resetUrl = $this->config['app_url'] . "/reset-password/{$token}";
        
        $body = $this->getEmailTemplate('password_reset', [
            'reset_url' => $resetUrl
        ]);

        return $this->sendEmail($email, '', $subject, $body);
    }

    public function sendWelcomeEmail(string $email, string $name, string $role): bool
    {
        $subject = 'Welcome to IndoWater';
        
        $body = $this->getEmailTemplate('welcome', [
            'name' => $name,
            'role' => $role,
            'login_url' => $this->config['app_url'] . '/login'
        ]);

        return $this->sendEmail($email, $name, $subject, $body);
    }

    public function sendLowCreditAlert(string $email, string $name, string $meterId, float $balance): bool
    {
        $subject = 'Low Credit Alert - IndoWater';
        
        $body = $this->getEmailTemplate('low_credit_alert', [
            'name' => $name,
            'meter_id' => $meterId,
            'balance' => number_format($balance, 0),
            'topup_url' => $this->config['app_url'] . '/dashboard/topup'
        ]);

        return $this->sendEmail($email, $name, $subject, $body);
    }

    public function sendPaymentConfirmation(string $email, string $name, array $paymentData): bool
    {
        $subject = 'Payment Confirmation - IndoWater';
        
        $body = $this->getEmailTemplate('payment_confirmation', [
            'name' => $name,
            'payment_id' => $paymentData['id'],
            'amount' => number_format($paymentData['amount'], 0),
            'method' => $paymentData['method'],
            'date' => date('d M Y H:i', strtotime($paymentData['created_at']))
        ]);

        return $this->sendEmail($email, $name, $subject, $body);
    }

    private function sendEmail(string $email, string $name, string $subject, string $body): bool
    {
        try {
            $mail = new PHPMailer(true);

            // Server settings
            $mail->isSMTP();
            $mail->Host = $this->config['mail_host'];
            $mail->SMTPAuth = !empty($this->config['mail_username']);
            $mail->Username = $this->config['mail_username'];
            $mail->Password = $this->config['mail_password'];
            $mail->SMTPSecure = $this->config['mail_encryption'] ?: PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port = $this->config['mail_port'];

            // Recipients
            $mail->setFrom($this->config['mail_from_address'], $this->config['mail_from_name']);
            $mail->addAddress($email, $name);

            // Content
            $mail->isHTML(true);
            $mail->Subject = $subject;
            $mail->Body = $body;

            $mail->send();
            return true;

        } catch (Exception $e) {
            error_log("Email sending failed: {$mail->ErrorInfo}");
            return false;
        }
    }

    private function getEmailTemplate(string $template, array $variables): string
    {
        $templates = [
            'verification' => '
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Verify Your Email Address</h2>
                    <p>Hello {{name}},</p>
                    <p>Thank you for registering with IndoWater. Please click the button below to verify your email address:</p>
                    <p style="text-align: center;">
                        <a href="{{verification_url}}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Verify Email</a>
                    </p>
                    <p>If you did not create an account, please ignore this email.</p>
                    <p>Best regards,<br>IndoWater Team</p>
                </div>
            ',
            'password_reset' => '
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Reset Your Password</h2>
                    <p>You have requested to reset your password. Please click the button below to reset it:</p>
                    <p style="text-align: center;">
                        <a href="{{reset_url}}" style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a>
                    </p>
                    <p>If you did not request this, please ignore this email.</p>
                    <p>Best regards,<br>IndoWater Team</p>
                </div>
            ',
            'welcome' => '
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Welcome to IndoWater</h2>
                    <p>Hello {{name}},</p>
                    <p>Welcome to IndoWater! Your account has been created successfully as a {{role}}.</p>
                    <p>You can now log in to your dashboard:</p>
                    <p style="text-align: center;">
                        <a href="{{login_url}}" style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Login to Dashboard</a>
                    </p>
                    <p>Best regards,<br>IndoWater Team</p>
                </div>
            ',
            'low_credit_alert' => '
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Low Credit Alert</h2>
                    <p>Hello {{name}},</p>
                    <p>Your water meter ({{meter_id}}) has a low credit balance of {{balance}} units.</p>
                    <p>Please top up your credit to avoid service interruption:</p>
                    <p style="text-align: center;">
                        <a href="{{topup_url}}" style="background-color: #ffc107; color: black; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Top Up Credit</a>
                    </p>
                    <p>Best regards,<br>IndoWater Team</p>
                </div>
            ',
            'payment_confirmation' => '
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #28a745;">Payment Confirmation</h2>
                    <p>Hello {{name}},</p>
                    <p>Your payment has been processed successfully and credit has been added to your meter:</p>
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <ul style="list-style: none; padding: 0;">
                            <li style="margin: 8px 0;"><strong>Payment ID:</strong> {{payment_id}}</li>
                            <li style="margin: 8px 0;"><strong>Amount:</strong> {{amount}}</li>
                            <li style="margin: 8px 0;"><strong>Method:</strong> {{payment_method}}</li>
                            <li style="margin: 8px 0;"><strong>Date:</strong> {{paid_at}}</li>
                        </ul>
                    </div>
                    <p>Your meter credit has been automatically updated. You can check your current balance in your dashboard.</p>
                    <p>Thank you for your payment!</p>
                    <p>Best regards,<br>IndoWater Team</p>
                </div>
            ',
            'low_balance_alert' => '
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #ffc107;">Low Balance Alert</h2>
                    <p>Hello {{name}},</p>
                    <p>Your water meter <strong>{{meter_id}}</strong> has a low credit balance:</p>
                    <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
                        <p style="margin: 0;"><strong>Current Balance:</strong> {{current_balance}}</p>
                        <p style="margin: 8px 0 0 0;"><strong>Alert Threshold:</strong> {{threshold}}</p>
                    </div>
                    <p>Please top up your credit to avoid service interruption.</p>
                    <p style="text-align: center;">
                        <a href="#" style="background-color: #ffc107; color: black; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Top Up Credit</a>
                    </p>
                    <p>Best regards,<br>IndoWater Team</p>
                </div>
            ',
            'meter_status_alert' => '
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #dc3545;">Meter Status Alert</h2>
                    <p>Hello {{name}},</p>
                    <p>There is an important status update for your water meter <strong>{{meter_id}}</strong>:</p>
                    <div style="background-color: #f8d7da; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545;">
                        <p style="margin: 0;"><strong>Status:</strong> {{status}}</p>
                        <p style="margin: 8px 0 0 0;">{{message}}</p>
                    </div>
                    <p>If you need assistance, please contact our support team.</p>
                    <p>Best regards,<br>IndoWater Team</p>
                </div>
            '
        ];

        $template = $templates[$template] ?? '';
        
        foreach ($variables as $key => $value) {
            $template = str_replace('{{' . $key . '}}', $value, $template);
        }

        return $template;
    }

    public function sendPaymentConfirmation(array $data): bool
    {
        $subject = 'Payment Confirmation - IndoWater';
        $template = $this->getTemplate('payment_confirmation', [
            'name' => $data['name'],
            'amount' => 'Rp ' . number_format($data['amount'], 0, ',', '.'),
            'payment_id' => $data['payment_id'],
            'payment_method' => ucfirst($data['payment_method']),
            'paid_at' => date('d M Y H:i', strtotime($data['paid_at']))
        ]);

        return $this->send($data['to'], $subject, $template);
    }

    public function sendLowBalanceAlert(array $data): bool
    {
        $subject = 'Low Balance Alert - IndoWater';
        $template = $this->getTemplate('low_balance_alert', [
            'name' => $data['name'],
            'meter_id' => $data['meter_id'],
            'current_balance' => 'Rp ' . number_format($data['current_balance'], 0, ',', '.'),
            'threshold' => 'Rp ' . number_format($data['threshold'], 0, ',', '.')
        ]);

        return $this->send($data['to'], $subject, $template);
    }

    public function sendMeterStatusAlert(array $data): bool
    {
        $subject = 'Meter Status Alert - IndoWater';
        $template = $this->getTemplate('meter_status_alert', [
            'name' => $data['name'],
            'meter_id' => $data['meter_id'],
            'status' => ucfirst($data['status']),
            'message' => $data['message'] ?? 'Please check your meter status.'
        ]);

        return $this->send($data['to'], $subject, $template);
    }

    /**
     * Send property registration notification to superadmin
     */
    public function sendPropertyRegistrationNotification(string $email, array $property): bool
    {
        $subject = 'New Property Registration - IndoWater';
        $template = $this->getTemplate('property_registration_notification', [
            'property_name' => $property['name'],
            'property_code' => $property['property_code'],
            'property_type' => ucfirst(str_replace('_', ' ', $property['type'])),
            'client_name' => $property['client_name'],
            'address' => $property['address'],
            'city' => $property['city'],
            'province' => $property['province'],
            'admin_url' => $this->config['app_url'] . '/admin/properties/' . $property['id']
        ]);

        return $this->send($email, $subject, $template);
    }

    /**
     * Send property verification status update to client
     */
    public function sendPropertyVerificationStatusUpdate(
        string $email, 
        array $property, 
        string $status, 
        string $notes = null, 
        string $rejectionReason = null
    ): bool {
        $statusMessages = [
            'pending' => 'Your property registration is pending review.',
            'under_review' => 'Your property registration is currently under review.',
            'approved' => 'Congratulations! Your property has been approved.',
            'rejected' => 'Unfortunately, your property registration has been rejected.',
            'requires_update' => 'Your property registration requires updates.'
        ];

        $subject = 'Property Verification Update - IndoWater';
        $template = $this->getTemplate('property_verification_status', [
            'property_name' => $property['name'],
            'property_code' => $property['property_code'],
            'status' => ucfirst(str_replace('_', ' ', $status)),
            'status_message' => $statusMessages[$status] ?? 'Status updated.',
            'notes' => $notes,
            'rejection_reason' => $rejectionReason,
            'property_url' => $this->config['app_url'] . '/properties/' . $property['id'],
            'is_approved' => $status === 'approved',
            'is_rejected' => $status === 'rejected',
            'requires_action' => in_array($status, ['rejected', 'requires_update'])
        ]);

        return $this->send($email, $subject, $template);
    }

    /**
     * Send document expiry notification
     */
    public function sendDocumentExpiryNotification(string $email, array $documents): bool
    {
        $subject = 'Document Expiry Notification - IndoWater';
        $template = $this->getTemplate('document_expiry_notification', [
            'documents' => $documents,
            'portal_url' => $this->config['app_url'] . '/properties'
        ]);

        return $this->send($email, $subject, $template);
    }

    /**
     * Send property meter association notification
     */
    public function sendMeterAssociationNotification(string $email, array $property, array $meter): bool
    {
        $subject = 'Meter Associated with Property - IndoWater';
        $template = $this->getTemplate('meter_association_notification', [
            'property_name' => $property['name'],
            'property_code' => $property['property_code'],
            'meter_id' => $meter['meter_id'],
            'meter_type' => $meter['meter_type'],
            'installation_location' => $meter['installation_location'] ?? 'Not specified',
            'property_url' => $this->config['app_url'] . '/properties/' . $property['id']
        ]);

        return $this->send($email, $subject, $template);
    }
}