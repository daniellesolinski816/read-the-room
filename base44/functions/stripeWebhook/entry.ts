import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return new Response('Webhook Error', { status: 400 });
  }

  const base44 = createClientFromRequest(req);

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userEmail = session.metadata?.user_email;
      if (userEmail) {
        const profiles = await base44.asServiceRole.entities.UserProfile.filter({ user_id: userEmail });
        if (profiles.length > 0) {
          await base44.asServiceRole.entities.UserProfile.update(profiles[0].id, {
            is_premium: true,
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription,
          });
          console.log(`Premium activated for ${userEmail}`);
        }
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      const customer = await stripe.customers.retrieve(subscription.customer);
      const userEmail = customer.email;
      if (userEmail) {
        const profiles = await base44.asServiceRole.entities.UserProfile.filter({ user_id: userEmail });
        if (profiles.length > 0) {
          await base44.asServiceRole.entities.UserProfile.update(profiles[0].id, { is_premium: false });
          console.log(`Premium removed for ${userEmail}`);
        }
      }
    }
  } catch (error) {
    console.error('Webhook handler error:', error.message);
  }

  return Response.json({ received: true });
});