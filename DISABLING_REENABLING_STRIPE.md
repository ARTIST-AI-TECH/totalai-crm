# Disabling and Re-enabling Stripe Integration

This document provides instructions for disabling and re-enabling Stripe integration in this SaaS starter template.

## Current Status

**Stripe is currently DISABLED** in this project to allow development without requiring Stripe credentials.

## What Has Been Disabled

The following Stripe-related features have been commented out:

### 1. Database Seed Script
- **File**: `lib/db/seed.ts`
- **Changes**: Stripe product creation is commented out
- **Impact**: You can seed the database without Stripe credentials

### 2. Authentication Flow
- **File**: `app/(login)/actions.ts`
- **Changes**:
  - `createCheckoutSession` import commented out
  - Checkout redirect logic in `signIn` and `signUp` functions commented out
- **Impact**: Users can sign in/up without being redirected to Stripe checkout

### 3. Payment Actions
- **File**: `lib/payments/actions.ts`
- **Changes**: All exports (`checkoutAction` and `customerPortalAction`) commented out
- **Impact**: Payment-related server actions are disabled

### 4. Pricing Page
- **File**: `app/(dashboard)/pricing/page.tsx`
- **Changes**:
  - Stripe imports commented out
  - Using hardcoded pricing instead of fetching from Stripe
  - Shows "Payment integration coming soon" message
- **Impact**: Pricing page displays static information

### 5. Dashboard Page
- **File**: `app/(dashboard)/dashboard/page.tsx`
- **Changes**:
  - `customerPortalAction` import commented out
  - "Manage Subscription" button is disabled
- **Impact**: Users cannot access subscription management

## Re-enabling Stripe

When you're ready to integrate Stripe, follow these steps:

### Step 1: Set Up Stripe
1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Get your API keys from the Stripe Dashboard
3. Install the Stripe CLI: [stripe.com/docs/stripe-cli](https://docs.stripe.com/stripe-cli)

### Step 2: Add Environment Variables
Add your Stripe credentials to `.env`:
```bash
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### Step 3: Uncomment Stripe Code
Search for comments containing "Commented out - Stripe not needed yet" and uncomment the code in these files:

1. **lib/db/seed.ts**
   - Uncomment the `stripe` import (line 1)
   - Uncomment the `createStripeProducts()` function
   - Uncomment the call to `createStripeProducts()` in the `seed()` function

2. **app/(login)/actions.ts**
   - Uncomment the `createCheckoutSession` import (line 22)
   - Uncomment the checkout redirect logic in `signIn` (lines 94-99)
   - Uncomment the checkout redirect logic in `signUp` (lines 216-221)
   - Change `_formData` back to `formData` in signUp function signature (line 110)

3. **lib/payments/actions.ts**
   - Uncomment all imports and exports
   - This restores `checkoutAction` and `customerPortalAction`

4. **app/(dashboard)/pricing/page.tsx**
   - Uncomment the Stripe imports (lines 1, 4)
   - Replace the hardcoded pricing with Stripe product/price fetching
   - Restore the original PricingCard implementation with checkout forms

5. **app/(dashboard)/dashboard/page.tsx**
   - Uncomment the `customerPortalAction` import (line 22)
   - Replace the disabled button with the original form implementation (lines 149-153)

### Step 4: Create Stripe Products
Run the seed script to create products in Stripe:
```bash
pnpm db:seed
```

This will create two products in your Stripe account:
- **Base**: $8/month with 7-day trial
- **Plus**: $12/month with 7-day trial

### Step 5: Set Up Webhook Locally
For local development, forward Stripe webhooks:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

This command will output a webhook signing secret. Add it to your `.env` file as `STRIPE_WEBHOOK_SECRET`.

### Step 6: Test the Integration
1. Start your development server: `pnpm dev`
2. Navigate to the pricing page: `http://localhost:3000/pricing`
3. Click on a plan to test the checkout flow
4. Use Stripe test card: `4242 4242 4242 4242`

## Production Deployment

When deploying to production with Stripe enabled:

1. **Create a production webhook** in your Stripe Dashboard
   - Set endpoint to: `https://yourdomain.com/api/stripe/webhook`
   - Select events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`

2. **Update environment variables** in your hosting platform:
   - `STRIPE_SECRET_KEY`: Use production secret key (starts with `sk_live_`)
   - `STRIPE_WEBHOOK_SECRET`: Use production webhook secret
   - `BASE_URL`: Set to your production domain

3. **Run migrations** in production:
   ```bash
   pnpm db:migrate
   ```

## Need Help?

- [Stripe Documentation](https://stripe.com/docs)
- [Next.js SaaS Starter Issues](https://github.com/nextjs/saas-starter/issues)

## Files Modified in This Project

All Stripe-related changes are marked with comments:
```typescript
// Commented out - Stripe not needed yet
```

Use your IDE's search feature to find all instances and uncomment them when ready to integrate Stripe.
