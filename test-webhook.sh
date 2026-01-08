#!/bin/bash

# Test the webhook with a sample payload

curl -X POST https://flowpro-totalai.netlify.app/api/webhooks/n8n \
  -H "Content-Type: application/json" \
  -H "x-crm-webhook-secret: ce1e6ea232cf2523a719c5f0442f4e126252cb6432fd0d934a353543abafffb5" \
  -d '{
    "workOrderId": "WO-TEST-001",
    "externalId": "TEST-001",
    "pmPlatform": "Tapi",
    "tenant": {
      "name": "Test Tenant",
      "phone": "555-1234",
      "email": "test@example.com"
    },
    "property": {
      "address": "123 Test Street",
      "keyNumber": "KEY-001"
    },
    "issue": {
      "title": "Test Issue",
      "description": "Testing webhook",
      "priority": "medium"
    },
    "simpro": {
      "jobId": "99999",
      "customerId": "9999",
      "customerName": "Test Customer",
      "siteId": "9999",
      "siteName": "Test Site",
      "stage": "Pending"
    },
    "timestamps": {
      "receivedAt": "2026-01-07T10:00:00Z",
      "scrapedAt": "2026-01-07T10:01:00Z",
      "jobCreatedAt": "2026-01-07T10:02:00Z"
    }
  }' \
  -v
