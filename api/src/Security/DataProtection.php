<?php

namespace IndoWater\Api\Security;

/**
 * Data Protection
 * 
 * This class provides methods for protecting sensitive data.
 */
class DataProtection
{
    /**
     * @var string
     */
    protected $encryptionKey;

    /**
     * @var string
     */
    protected $encryptionMethod = 'AES-256-CBC';

    /**
     * Constructor
     * 
     * @param string $encryptionKey
     */
    public function __construct(string $encryptionKey)
    {
        $this->encryptionKey = $encryptionKey;
    }

    /**
     * Encrypt data
     * 
     * @param string $data
     * 
     * @return string
     */
    public function encrypt(string $data): string
    {
        $ivLength = openssl_cipher_iv_length($this->encryptionMethod);
        $iv = openssl_random_pseudo_bytes($ivLength);
        
        $encrypted = openssl_encrypt(
            $data,
            $this->encryptionMethod,
            $this->encryptionKey,
            OPENSSL_RAW_DATA,
            $iv
        );
        
        // Prepend IV to the encrypted data
        $encrypted = $iv . $encrypted;
        
        // Base64 encode the result
        return base64_encode($encrypted);
    }

    /**
     * Decrypt data
     * 
     * @param string $data
     * 
     * @return string
     */
    public function decrypt(string $data): string
    {
        // Base64 decode the data
        $data = base64_decode($data);
        
        $ivLength = openssl_cipher_iv_length($this->encryptionMethod);
        
        // Extract IV from the beginning of the data
        $iv = substr($data, 0, $ivLength);
        
        // Extract the encrypted data
        $encrypted = substr($data, $ivLength);
        
        // Decrypt the data
        $decrypted = openssl_decrypt(
            $encrypted,
            $this->encryptionMethod,
            $this->encryptionKey,
            OPENSSL_RAW_DATA,
            $iv
        );
        
        return $decrypted;
    }

    /**
     * Hash data
     * 
     * @param string $data
     * 
     * @return string
     */
    public function hash(string $data): string
    {
        return password_hash($data, PASSWORD_ARGON2ID, [
            'memory_cost' => 65536, // 64MB
            'time_cost' => 4,
            'threads' => 3,
        ]);
    }

    /**
     * Verify hashed data
     * 
     * @param string $data
     * @param string $hash
     * 
     * @return bool
     */
    public function verifyHash(string $data, string $hash): bool
    {
        return password_verify($data, $hash);
    }

    /**
     * Mask sensitive data
     * 
     * @param string $data
     * @param string $type
     * 
     * @return string
     */
    public function mask(string $data, string $type = 'default'): string
    {
        switch ($type) {
            case 'email':
                return $this->maskEmail($data);
            
            case 'phone':
                return $this->maskPhone($data);
            
            case 'credit_card':
                return $this->maskCreditCard($data);
            
            case 'ssn':
                return $this->maskSSN($data);
            
            case 'address':
                return $this->maskAddress($data);
            
            default:
                return $this->maskDefault($data);
        }
    }

    /**
     * Mask email address
     * 
     * @param string $email
     * 
     * @return string
     */
    protected function maskEmail(string $email): string
    {
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return $email;
        }

        list($username, $domain) = explode('@', $email);
        
        $usernameLength = strlen($username);
        $maskedUsername = substr($username, 0, 2) . str_repeat('*', $usernameLength - 2);
        
        return $maskedUsername . '@' . $domain;
    }

    /**
     * Mask phone number
     * 
     * @param string $phone
     * 
     * @return string
     */
    protected function maskPhone(string $phone): string
    {
        // Remove non-numeric characters
        $phone = preg_replace('/[^0-9]/', '', $phone);
        
        $phoneLength = strlen($phone);
        
        if ($phoneLength <= 4) {
            return $phone;
        }
        
        return str_repeat('*', $phoneLength - 4) . substr($phone, -4);
    }

    /**
     * Mask credit card number
     * 
     * @param string $creditCard
     * 
     * @return string
     */
    protected function maskCreditCard(string $creditCard): string
    {
        // Remove non-numeric characters
        $creditCard = preg_replace('/[^0-9]/', '', $creditCard);
        
        $cardLength = strlen($creditCard);
        
        if ($cardLength <= 4) {
            return $creditCard;
        }
        
        return str_repeat('*', $cardLength - 4) . substr($creditCard, -4);
    }

    /**
     * Mask Social Security Number
     * 
     * @param string $ssn
     * 
     * @return string
     */
    protected function maskSSN(string $ssn): string
    {
        // Remove non-numeric characters
        $ssn = preg_replace('/[^0-9]/', '', $ssn);
        
        $ssnLength = strlen($ssn);
        
        if ($ssnLength <= 4) {
            return $ssn;
        }
        
        return str_repeat('*', $ssnLength - 4) . substr($ssn, -4);
    }

    /**
     * Mask address
     * 
     * @param string $address
     * 
     * @return string
     */
    protected function maskAddress(string $address): string
    {
        $words = explode(' ', $address);
        
        if (count($words) <= 1) {
            return $address;
        }
        
        // Mask all but the first word and the last word
        $maskedWords = [$words[0]];
        
        for ($i = 1; $i < count($words) - 1; $i++) {
            $maskedWords[] = str_repeat('*', strlen($words[$i]));
        }
        
        $maskedWords[] = $words[count($words) - 1];
        
        return implode(' ', $maskedWords);
    }

    /**
     * Mask default
     * 
     * @param string $data
     * 
     * @return string
     */
    protected function maskDefault(string $data): string
    {
        $length = strlen($data);
        
        if ($length <= 4) {
            return $data;
        }
        
        $visibleChars = (int) ($length / 4);
        $visibleChars = max(2, min($visibleChars, 4));
        
        return substr($data, 0, $visibleChars) . str_repeat('*', $length - $visibleChars * 2) . substr($data, -$visibleChars);
    }
}