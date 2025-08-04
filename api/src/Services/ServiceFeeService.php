<?php

declare(strict_types=1);

namespace IndoWater\Api\Services;

use IndoWater\Api\Models\Client;
use IndoWater\Api\Models\ServiceFeePlan;
use IndoWater\Api\Models\ServiceFeeComponent;
use IndoWater\Api\Models\ServiceFeeTransaction;
use IndoWater\Api\Models\ServiceFeeInvoice;
use Ramsey\Uuid\Uuid;

class ServiceFeeService
{
    private Client $clientModel;
    private ServiceFeePlan $servicePlanModel;
    private ServiceFeeComponent $serviceComponentModel;
    private ServiceFeeTransaction $serviceTransactionModel;
    private ServiceFeeInvoice $serviceInvoiceModel;
    private $db;

    public function __construct(
        Client $clientModel,
        ServiceFeePlan $servicePlanModel,
        ServiceFeeComponent $serviceComponentModel,
        ServiceFeeTransaction $serviceTransactionModel,
        ServiceFeeInvoice $serviceInvoiceModel,
        $db
    ) {
        $this->clientModel = $clientModel;
        $this->servicePlanModel = $servicePlanModel;
        $this->serviceComponentModel = $serviceComponentModel;
        $this->serviceTransactionModel = $serviceTransactionModel;
        $this->serviceInvoiceModel = $serviceInvoiceModel;
        $this->db = $db;
    }

    public function calculateAndRecordFees(array $payment): array
    {
        // Get customer's client ID
        $sql = "SELECT c.client_id FROM customers c WHERE c.id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$payment['customer_id']]);
        $clientId = $stmt->fetchColumn();
        
        if (!$clientId) {
            throw new \Exception('Client not found for customer');
        }
        
        // Get client's service fee plan
        $plan = $this->servicePlanModel->getActiveClientPlan($clientId);
        
        // If no plan found, use legacy service fee from client
        if (!$plan) {
            $client = $this->clientModel->find($clientId);
            if (!$client) {
                throw new \Exception('Client not found');
            }
            
            // Calculate fee using legacy method
            $feeAmount = 0;
            if ($client['service_fee_type'] === 'percentage') {
                $feeAmount = $payment['amount'] * ($client['service_fee_value'] / 100);
            } else {
                $feeAmount = $client['service_fee_value'];
            }
            
            // Record the fee transaction
            $feeTransaction = $this->serviceTransactionModel->create([
                'client_id' => $clientId,
                'payment_id' => $payment['id'],
                'plan_id' => null,
                'component_id' => null,
                'transaction_amount' => $payment['amount'],
                'fee_amount' => $feeAmount,
                'fee_type' => $client['service_fee_type'],
                'fee_value' => $client['service_fee_value'],
                'status' => 'pending'
            ]);
            
            return [
                'fee_transactions' => [$feeTransaction],
                'total_fee' => $feeAmount
            ];
        }
        
        // Calculate fees for each component in the plan
        $feeTransactions = [];
        $totalFee = 0;
        
        foreach ($plan['components'] as $component) {
            if (!$component['is_active']) {
                continue;
            }
            
            // Calculate fee for this component
            $feeResult = $this->serviceComponentModel->calculateFee($component['id'], $payment['amount']);
            
            // Skip if fee amount is 0
            if ($feeResult['fee_amount'] <= 0) {
                continue;
            }
            
            // Record the fee transaction
            $feeTransaction = $this->serviceTransactionModel->create([
                'client_id' => $clientId,
                'payment_id' => $payment['id'],
                'plan_id' => $plan['id'],
                'component_id' => $component['id'],
                'transaction_amount' => $payment['amount'],
                'fee_amount' => $feeResult['fee_amount'],
                'fee_type' => $component['fee_type'],
                'fee_value' => $component['fee_value'],
                'status' => 'pending'
            ]);
            
            $feeTransactions[] = $feeTransaction;
            $totalFee += $feeResult['fee_amount'];
        }
        
        return [
            'fee_transactions' => $feeTransactions,
            'total_fee' => $totalFee
        ];
    }

    public function generateMonthlyInvoice(string $clientId, string $year, string $month, array $options = []): ?array
    {
        // Determine billing period
        $startDate = sprintf('%s-%s-01', $year, $month);
        $endDate = date('Y-m-t', strtotime($startDate));
        
        // Create invoice from pending fees
        return $this->serviceInvoiceModel->createFromPendingFees($clientId, $startDate, $endDate, $options);
    }

    public function generateCustomInvoice(string $clientId, string $startDate, string $endDate, array $options = []): ?array
    {
        // Create invoice from pending fees
        return $this->serviceInvoiceModel->createFromPendingFees($clientId, $startDate, $endDate, $options);
    }

    public function getClientFeeReport(string $clientId, string $startDate, string $endDate): array
    {
        // Get daily stats
        $dailyStats = $this->serviceTransactionModel->getClientStats($clientId, $startDate, $endDate);
        
        // Get totals
        $totals = $this->serviceTransactionModel->getClientTotals($clientId, $startDate, $endDate);
        
        // Get invoices for the period
        $invoices = $this->serviceInvoiceModel->findByClientId($clientId, [
            'start_date' => $startDate,
            'end_date' => $endDate
        ]);
        
        return [
            'client_id' => $clientId,
            'period' => [
                'start_date' => $startDate,
                'end_date' => $endDate
            ],
            'daily_stats' => $dailyStats,
            'totals' => $totals,
            'invoices' => $invoices
        ];
    }

    public function getAccrualReport(string $startDate, string $endDate): array
    {
        $sql = "SELECT 
                    c.id as client_id,
                    c.company_name as client_name,
                    COUNT(t.id) as transaction_count,
                    SUM(t.transaction_amount) as total_transaction_amount,
                    SUM(t.fee_amount) as total_fee_amount,
                    COUNT(CASE WHEN t.status = 'pending' THEN 1 END) as pending_count,
                    SUM(CASE WHEN t.status = 'pending' THEN t.fee_amount ELSE 0 END) as pending_amount,
                    COUNT(CASE WHEN t.status = 'invoiced' THEN 1 END) as invoiced_count,
                    SUM(CASE WHEN t.status = 'invoiced' THEN t.fee_amount ELSE 0 END) as invoiced_amount,
                    COUNT(CASE WHEN t.status = 'paid' THEN 1 END) as paid_count,
                    SUM(CASE WHEN t.status = 'paid' THEN t.fee_amount ELSE 0 END) as paid_amount
                FROM clients c
                LEFT JOIN service_fee_transactions t ON c.id = t.client_id
                    AND t.created_at BETWEEN ? AND ?
                    AND t.deleted_at IS NULL
                WHERE c.deleted_at IS NULL
                GROUP BY c.id, c.company_name
                ORDER BY c.company_name";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            $startDate . ' 00:00:00', 
            $endDate . ' 23:59:59'
        ]);
        
        $clientReports = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        
        // Calculate totals
        $totals = [
            'transaction_count' => 0,
            'total_transaction_amount' => 0,
            'total_fee_amount' => 0,
            'pending_count' => 0,
            'pending_amount' => 0,
            'invoiced_count' => 0,
            'invoiced_amount' => 0,
            'paid_count' => 0,
            'paid_amount' => 0
        ];
        
        foreach ($clientReports as $report) {
            $totals['transaction_count'] += (int)$report['transaction_count'];
            $totals['total_transaction_amount'] += (float)$report['total_transaction_amount'];
            $totals['total_fee_amount'] += (float)$report['total_fee_amount'];
            $totals['pending_count'] += (int)$report['pending_count'];
            $totals['pending_amount'] += (float)$report['pending_amount'];
            $totals['invoiced_count'] += (int)$report['invoiced_count'];
            $totals['invoiced_amount'] += (float)$report['invoiced_amount'];
            $totals['paid_count'] += (int)$report['paid_count'];
            $totals['paid_amount'] += (float)$report['paid_amount'];
        }
        
        return [
            'period' => [
                'start_date' => $startDate,
                'end_date' => $endDate
            ],
            'clients' => $clientReports,
            'totals' => $totals
        ];
    }
}