<?php

declare(strict_types=1);

namespace IndoWater\Api\Services;

class EncryptionService
{
    private string $key;
    private string $cipher;
    private string $hashAlgo;
    
    /**
     * Initialize the encryption service with the application key
     */
    public function __construct(string $appKey, string $cipher = 'aes-256-cbc', string $hashAlgo = 'sha256')
    {
        if (empty($appKey)) {
            throw new \RuntimeException('Application key is not set. Please set APP_KEY in your environment.');
        }
        
        $this->key = $this->deriveKey($appKey);
        $this->cipher = $cipher;
        $this->hashAlgo = $hashAlgo;
        
        if (!in_array($cipher, openssl_get_cipher_methods())) {
            throw new \RuntimeException("Unsupported cipher method: {$cipher}");
        }
    }
    
    /**
     * Encrypt a value
     *
     * @param mixed $value The value to encrypt
     * @return string The encrypted value
     */
    public function encrypt($value): string
    {
        $value = is_array($value) || is_object($value) ? json_encode($value) : (string) $value;
        
        // Generate a random initialization vector
        $iv = openssl_random_pseudo_bytes(openssl_cipher_iv_length($this->cipher));
        
        // Encrypt the data
        $encrypted = openssl_encrypt($value, $this->cipher, $this->key, 0, $iv);
        
        if ($encrypted === false) {
            throw new \RuntimeException('Encryption failed: ' . openssl_error_string());
        }
        
        // Create a MAC for the encrypted value
        $mac = $this->createMac($iv, $encrypted);
        
        // Combine the IV, encrypted data, and MAC
        $json = json_encode([
            'iv' => base64_encode($iv),
            'value' => $encrypted,
            'mac' => $mac,
        ]);
        
        return base64_encode($json);
    }
    
    /**
     * Decrypt a value
     *
     * @param string $payload The encrypted payload
     * @return mixed The decrypted value
     */
    public function decrypt(string $payload)
    {
        $payload = json_decode(base64_decode($payload), true);
        
        if (!$this->isValidPayload($payload)) {
            throw new \RuntimeException('Invalid encryption payload.');
        }
        
        $iv = base64_decode($payload['iv']);
        $encrypted = $payload['value'];
        $mac = $payload['mac'];
        
        // Verify the MAC
        if (!$this->isValidMac($iv, $encrypted, $mac)) {
            throw new \RuntimeException('MAC verification failed. Data may have been tampered with.');
        }
        
        // Decrypt the data
        $decrypted = openssl_decrypt($encrypted, $this->cipher, $this->key, 0, $iv);
        
        if ($decrypted === false) {
            throw new \RuntimeException('Decryption failed: ' . openssl_error_string());
        }
        
        // Try to decode JSON if the decrypted value is a valid JSON string
        $decoded = json_decode($decrypted, true);
        return (json_last_error() === JSON_ERROR_NONE) ? $decoded : $decrypted;
    }
    
    /**
     * Hash a value using a secure algorithm
     *
     * @param string $value The value to hash
     * @return string The hashed value
     */
    public function hash(string $value): string
    {
        return hash($this->hashAlgo, $value);
    }
    
    /**
     * Create a secure hash for password storage
     *
     * @param string $password The password to hash
     * @return string The hashed password
     */
    public function hashPassword(string $password): string
    {
        return password_hash($password, PASSWORD_ARGON2ID, [
            'memory_cost' => 65536, // 64MB
            'time_cost' => 4,       // 4 iterations
            'threads' => 3,         // 3 threads
        ]);
    }
    
    /**
     * Verify a password against a hash
     *
     * @param string $password The password to verify
     * @param string $hash The hash to verify against
     * @return bool Whether the password matches the hash
     */
    public function verifyPassword(string $password, string $hash): bool
    {
        return password_verify($password, $hash);
    }
    
    /**
     * Derive an encryption key from the application key
     */
    private function deriveKey(string $appKey): string
    {
        return hash_pbkdf2($this->hashAlgo, $appKey, 'indowater-salt', 10000, 32, true);
    }
    
    /**
     * Create a MAC for the encrypted data
     */
    private function createMac(string $iv, string $encrypted): string
    {
        return hash_hmac($this->hashAlgo, base64_encode($iv) . $encrypted, $this->key);
    }
    
    /**
     * Validate the encryption payload structure
     */
    private function isValidPayload(array $payload): bool
    {
        return isset($payload['iv'], $payload['value'], $payload['mac']) &&
               is_string($payload['iv']) &&
               is_string($payload['value']) &&
               is_string($payload['mac']);
    }
    
    /**
     * Verify the MAC for the encrypted data
     */
    private function isValidMac(string $iv, string $encrypted, string $mac): bool
    {
        $calculatedMac = $this->createMac($iv, $encrypted);
        return hash_equals($calculatedMac, $mac);
    }
    
    /**
     * Generate a secure random token
     *
     * @param int $length The length of the token
     * @return string The generated token
     */
    public function generateToken(int $length = 32): string
    {
        return bin2hex(random_bytes($length / 2));
    }
}