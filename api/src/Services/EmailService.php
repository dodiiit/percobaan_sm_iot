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
                    <h2>Payment Confirmation</h2>
                    <p>Hello {{name}},</p>
                    <p>Your payment has been processed successfully:</p>
                    <ul>
                        <li>Payment ID: {{payment_id}}</li>
                        <li>Amount: Rp {{amount}}</li>
                        <li>Method: {{method}}</li>
                        <li>Date: {{date}}</li>
                    </ul>
                    <p>Thank you for your payment!</p>
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
}