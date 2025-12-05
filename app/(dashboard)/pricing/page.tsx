// Commented out - Stripe not needed yet
// import { checkoutAction } from '@/lib/payments/actions';
import { Check } from 'lucide-react';
// import { getStripePrices, getStripeProducts } from '@/lib/payments/stripe';
// import { SubmitButton } from './submit-button';

export default async function PricingPage() {
  // Hardcoded pricing until Stripe is integrated
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid md:grid-cols-2 gap-8 max-w-xl mx-auto">
        <PricingCard
          name="Base"
          price={800}
          interval="month"
          trialDays={7}
          features={[
            'Unlimited Usage',
            'Unlimited Workspace Members',
            'Email Support',
          ]}
        />
        <PricingCard
          name="Plus"
          price={1200}
          interval="month"
          trialDays={7}
          features={[
            'Everything in Base, and:',
            'Early Access to New Features',
            '24/7 Support + Slack Access',
          ]}
        />
      </div>
    </main>
  );
}

function PricingCard({
  name,
  price,
  interval,
  trialDays,
  features,
}: {
  name: string;
  price: number;
  interval: string;
  trialDays: number;
  features: string[];
}) {
  return (
    <div className="pt-6">
      <h2 className="text-2xl font-medium text-gray-900 mb-2">{name}</h2>
      <p className="text-sm text-gray-600 mb-4">
        with {trialDays} day free trial
      </p>
      <p className="text-4xl font-medium text-gray-900 mb-6">
        ${price / 100}{' '}
        <span className="text-xl font-normal text-gray-600">
          per user / {interval}
        </span>
      </p>
      <ul className="space-y-4 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <Check className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-gray-700">{feature}</span>
          </li>
        ))}
      </ul>
      <div className="text-center">
        <p className="text-sm text-gray-500 mb-4">
          Payment integration coming soon
        </p>
        <div className="w-full px-4 py-2 bg-gray-100 text-gray-400 rounded-full text-center">
          Contact Support
        </div>
      </div>
    </div>
  );
}
