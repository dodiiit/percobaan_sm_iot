# Rate Management Features Documentation

This document provides an overview of the rate management features implemented in the IndoWater system.

## Overview

The rate management system provides flexible pricing options for water services, including:

1. **Dynamic Pricing**: Flexible rate structures for different property types
2. **Seasonal Rates**: Support for time-based rate changes
3. **Minimum Charges**: Configurable minimum monthly charges
4. **Bulk Discounts**: Volume-based pricing tiers
5. **Dynamic Discounts**: Discount system that automatically adjusts based on various factors

## Database Structure

The rate management system uses the following tables:

- `tariffs`: Base table for storing tariff information
- `tariff_tiers`: Volume-based pricing tiers for a tariff
- `seasonal_rates`: Time-based rate adjustments
- `bulk_discount_tiers`: Volume-based discount tiers
- `dynamic_discount_rules`: Rules for dynamic discounts
- `property_tariffs`: Assignments of tariffs to properties
- `applied_discounts`: Records of applied discounts

## API Endpoints

### Tariff Management

- `GET /api/tariffs/client/{clientId}`: Get all tariffs for a client
- `GET /api/tariffs/{id}`: Get a single tariff
- `GET /api/tariffs/{id}/complete`: Get a tariff with all related data
- `POST /api/tariffs`: Create a new tariff
- `PUT /api/tariffs/{id}`: Update a tariff
- `DELETE /api/tariffs/{id}`: Delete a tariff
- `POST /api/tariffs/{id}/calculate-price`: Calculate price for a given volume

### Seasonal Rates

- `GET /api/tariffs/{tariffId}/seasonal-rates`: Get all seasonal rates for a tariff
- `POST /api/tariffs/{tariffId}/seasonal-rates`: Create a new seasonal rate
- `PUT /api/tariffs/seasonal-rates/{id}`: Update a seasonal rate
- `DELETE /api/tariffs/seasonal-rates/{id}`: Delete a seasonal rate

### Bulk Discounts

- `GET /api/tariffs/{tariffId}/bulk-discounts`: Get all bulk discount tiers for a tariff
- `POST /api/tariffs/{tariffId}/bulk-discounts`: Create a new bulk discount tier
- `PUT /api/tariffs/bulk-discounts/{id}`: Update a bulk discount tier
- `DELETE /api/tariffs/bulk-discounts/{id}`: Delete a bulk discount tier

### Dynamic Discounts

- `GET /api/tariffs/{tariffId}/dynamic-discounts`: Get all dynamic discount rules for a tariff
- `POST /api/tariffs/{tariffId}/dynamic-discounts`: Create a new dynamic discount rule
- `PUT /api/tariffs/dynamic-discounts/{id}`: Update a dynamic discount rule
- `DELETE /api/tariffs/dynamic-discounts/{id}`: Delete a dynamic discount rule

### Property Tariff Assignments

- `GET /api/property-tariffs/property/{propertyId}`: Get all tariff assignments for a property
- `GET /api/property-tariffs/property/{propertyId}/current`: Get current tariff for a property
- `POST /api/property-tariffs/property/{propertyId}`: Assign a tariff to a property
- `PUT /api/property-tariffs/{id}`: Update a property tariff assignment
- `DELETE /api/property-tariffs/{id}`: Delete a property tariff assignment

### Applied Discounts

- `GET /api/discounts/customer/{customerId}`: Get all applied discounts for a customer
- `GET /api/discounts/customer/{customerId}/stats`: Get discount statistics for a customer

## Feature Details

### Dynamic Pricing

Dynamic pricing allows for different rate structures based on property types. Each tariff can have multiple tiers with different prices per unit volume.

Example:
```json
{
  "tariff": {
    "id": "uuid-here",
    "name": "Residential Standard",
    "property_type": "residential",
    "base_price": 10000
  },
  "tiers": [
    {
      "min_volume": 0,
      "max_volume": 10,
      "price_per_unit": 1000
    },
    {
      "min_volume": 10,
      "max_volume": 20,
      "price_per_unit": 1500
    },
    {
      "min_volume": 20,
      "max_volume": null,
      "price_per_unit": 2000
    }
  ]
}
```

### Seasonal Rates

Seasonal rates allow for time-based rate adjustments. For example, rates can be increased during dry seasons or decreased during rainy seasons.

Example:
```json
{
  "name": "Dry Season Surcharge",
  "start_date": "2025-06-01",
  "end_date": "2025-09-30",
  "rate_adjustment_type": "percentage",
  "rate_adjustment_value": 10
}
```

### Minimum Charges

Minimum charges ensure that customers are billed a minimum amount regardless of their consumption.

Example:
```json
{
  "has_minimum_charge": true,
  "minimum_charge_amount": 50000
}
```

### Bulk Discounts

Bulk discounts provide volume-based discounts for high consumption.

Example:
```json
{
  "min_volume": 100,
  "max_volume": 200,
  "discount_type": "percentage",
  "discount_value": 5
}
```

### Dynamic Discounts

Dynamic discounts automatically adjust based on various factors such as time, customer behavior, or inventory levels.

Example:
```json
{
  "name": "Weekend Off-Peak Discount",
  "rule_type": "time_based",
  "conditions": {
    "days_of_week": ["Saturday", "Sunday"],
    "time_range": {
      "start": 22,
      "end": 6
    }
  },
  "discount_type": "percentage",
  "discount_value": 15
}
```

## Usage Examples

### Calculating Price with Discounts

```
POST /api/tariffs/{id}/calculate-price
{
  "volume": 25,
  "customer_id": "customer-uuid",
  "meter_id": "meter-uuid"
}
```

Response:
```json
{
  "success": true,
  "tariff_id": "tariff-uuid",
  "tariff_name": "Residential Standard",
  "volume": 25,
  "base_price": 42500,
  "discounts": [
    {
      "type": "seasonal_rate",
      "id": "seasonal-rate-uuid",
      "name": "Rainy Season Discount",
      "amount": 4250
    },
    {
      "type": "bulk_discount",
      "id": "bulk-discount-uuid",
      "min_volume": 20,
      "max_volume": 50,
      "amount": 1912.5
    }
  ],
  "final_price": 36337.5
}
```

## Implementation Notes

1. All rates and discounts can be enabled/disabled independently
2. Tariffs can be assigned to properties with effective date ranges
3. Multiple discount types can be combined
4. Dynamic discounts use a priority system to determine which discount to apply when multiple rules match
5. All discount applications are recorded for auditing and reporting purposes