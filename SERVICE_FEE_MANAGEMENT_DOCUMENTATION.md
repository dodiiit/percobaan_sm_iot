# Service Fee Management Features Documentation

This document provides an overview of the service fee management features implemented in the IndoWater system.

## Overview

The service fee management system provides a comprehensive solution for managing service fees charged to clients for each transaction made by their customers. Key features include:

1. **Dynamic Service Fees**: Flexible fee structures with multiple components
2. **Tiered Pricing**: Volume-based fee tiers
3. **Fee Plans**: Reusable fee plans that can be assigned to clients
4. **Automatic Fee Calculation**: Fees automatically calculated and recorded for each payment
5. **Invoicing**: Generation of invoices for collected fees
6. **Comprehensive Reports**: Detailed reports including accrual reports for billing

## Database Structure

The service fee management system uses the following tables:

- `service_fee_plans`: Base table for storing fee plan information
- `service_fee_components`: Components of a fee plan (e.g., transaction fee, processing fee)
- `service_fee_tiers`: Volume-based fee tiers for tiered pricing components
- `client_service_fee_plans`: Assignments of fee plans to clients with effective dates
- `service_fee_transactions`: Records of calculated fees for each payment
- `service_fee_invoices`: Invoices generated for collected fees

## API Endpoints

### Fee Plan Management

- `GET /api/service-fees/plans`: Get all fee plans
- `GET /api/service-fees/plans/{id}`: Get a single fee plan
- `GET /api/service-fees/plans/{id}/complete`: Get a fee plan with all related data
- `POST /api/service-fees/plans`: Create a new fee plan
- `PUT /api/service-fees/plans/{id}`: Update a fee plan
- `DELETE /api/service-fees/plans/{id}`: Delete a fee plan

### Fee Components

- `GET /api/service-fees/plans/{planId}/components`: Get all components for a plan
- `POST /api/service-fees/plans/{planId}/components`: Create a new component
- `PUT /api/service-fees/components/{id}`: Update a component
- `DELETE /api/service-fees/components/{id}`: Delete a component

### Client Plan Assignment

- `GET /api/service-fees/client/{clientId}/plan`: Get active fee plan for a client
- `POST /api/service-fees/client/{clientId}/plan`: Assign a fee plan to a client
- `GET /api/service-fees/client/{clientId}/plan-assignments`: Get all plan assignments for a client

### Fee Transactions

- `GET /api/service-fees/client/{clientId}/transactions`: Get all fee transactions for a client

### Fee Invoices

- `GET /api/service-fees/client/{clientId}/invoices`: Get all invoices for a client
- `GET /api/service-fees/invoices/{id}`: Get a single invoice with transactions
- `POST /api/service-fees/client/{clientId}/invoices/monthly`: Generate a monthly invoice
- `POST /api/service-fees/client/{clientId}/invoices/custom`: Generate a custom invoice for a date range
- `PUT /api/service-fees/invoices/{id}/issue`: Issue an invoice
- `PUT /api/service-fees/invoices/{id}/mark-paid`: Mark an invoice as paid
- `PUT /api/service-fees/invoices/{id}/cancel`: Cancel an invoice

### Reports

- `GET /api/service-fees/client/{clientId}/report`: Get fee report for a client
- `GET /api/service-fees/reports/accrual`: Get accrual report for all clients

## Feature Details

### Dynamic Service Fees

The system supports multiple fee types:

1. **Fixed Fee**: A fixed amount per transaction
2. **Percentage Fee**: A percentage of the transaction amount
3. **Tiered Fixed Fee**: Different fixed amounts based on transaction volume
4. **Tiered Percentage Fee**: Different percentages based on transaction volume

Each fee plan can have multiple components, allowing for complex fee structures.

Example:
```json
{
  "plan": {
    "id": "uuid-here",
    "name": "Standard Fee Plan",
    "description": "Standard fee plan for most clients"
  },
  "components": [
    {
      "name": "Transaction Fee",
      "fee_type": "percentage",
      "fee_value": 2.5,
      "min_fee_amount": 1000,
      "max_fee_amount": 10000
    },
    {
      "name": "Processing Fee",
      "fee_type": "fixed",
      "fee_value": 500
    }
  ]
}
```

### Tiered Pricing

For tiered pricing components, different fee values apply based on transaction amount ranges.

Example:
```json
{
  "name": "Volume-based Fee",
  "fee_type": "tiered_percentage",
  "fee_value": 0,
  "tiers": [
    {
      "min_amount": 0,
      "max_amount": 1000000,
      "fee_value": 3.0
    },
    {
      "min_amount": 1000000,
      "max_amount": 5000000,
      "fee_value": 2.5
    },
    {
      "min_amount": 5000000,
      "max_amount": null,
      "fee_value": 2.0
    }
  ]
}
```

### Fee Plans

Fee plans are reusable configurations that can be assigned to clients. Each client can have one active fee plan at a time, with effective dates for future changes.

Example:
```json
{
  "plan_id": "uuid-here",
  "client_id": "client-uuid",
  "effective_from": "2025-08-01",
  "effective_to": null
}
```

### Automatic Fee Calculation

When a payment is successfully processed, the system automatically:

1. Identifies the client associated with the customer
2. Retrieves the client's active fee plan
3. Calculates fees for each component in the plan
4. Records the fee transactions

### Invoicing

The system supports generating invoices for collected fees:

1. **Monthly Invoices**: All fees collected in a specific month
2. **Custom Invoices**: Fees collected in a custom date range

Invoices go through a lifecycle:
- **Draft**: Initially created
- **Issued**: Officially issued to the client
- **Paid**: Marked as paid when payment is received
- **Cancelled**: Cancelled if needed

### Comprehensive Reports

The system provides detailed reports:

1. **Client Fee Report**: All fees collected from a specific client
2. **Accrual Report**: Overview of all fees accrued across all clients

## Integration with Payment Processing

The service fee management system is integrated with the payment processing flow:

1. When a payment is successfully processed, the `PaymentService` calls the `ServiceFeeService`
2. The `ServiceFeeService` calculates and records fees based on the client's fee plan
3. Fee transactions are initially recorded with a 'pending' status
4. Fees can later be included in invoices

## Implementation Notes

1. All fee components can be enabled/disabled independently
2. Fee plans can be assigned to clients with effective date ranges
3. Multiple fee components can be combined in a single plan
4. Minimum and maximum fee amounts can be set for percentage-based fees
5. All fee transactions are recorded for auditing and reporting purposes
6. The system supports generating comprehensive reports for financial reconciliation