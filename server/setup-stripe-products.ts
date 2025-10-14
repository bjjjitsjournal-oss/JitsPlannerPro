import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function setupStripeProducts() {
  try {
    console.log('🔧 Setting up Stripe subscription products...\n');

    // Create BJJ Enthusiast product and price
    const enthusiastProduct = await stripe.products.create({
      name: 'BJJ Enthusiast',
      description: 'Unlimited class logs and notes, 1 community share per week',
    });

    const enthusiastPrice = await stripe.prices.create({
      unit_amount: 999, // $9.99
      currency: 'usd',
      recurring: { interval: 'month' },
      product: enthusiastProduct.id,
    });

    console.log('✅ BJJ Enthusiast created:');
    console.log(`   Product ID: ${enthusiastProduct.id}`);
    console.log(`   Price ID: ${enthusiastPrice.id}`);
    console.log(`   Amount: $9.99/month\n`);

    // Create Gym Pro product and price
    const gymProProduct = await stripe.products.create({
      name: 'Gym Pro',
      description: 'All features + 10 community shares/week, unlimited gym shares (requires approval)',
    });

    const gymProPrice = await stripe.prices.create({
      unit_amount: 1999, // $19.99
      currency: 'usd',
      recurring: { interval: 'month' },
      product: gymProProduct.id,
    });

    console.log('✅ Gym Pro created:');
    console.log(`   Product ID: ${gymProProduct.id}`);
    console.log(`   Price ID: ${gymProPrice.id}`);
    console.log(`   Amount: $19.99/month\n`);

    console.log('📋 Add these to your .env file:');
    console.log(`STRIPE_ENTHUSIAST_PRICE_ID=${enthusiastPrice.id}`);
    console.log(`STRIPE_GYM_PRO_PRICE_ID=${gymProPrice.id}`);
    console.log('\n✨ Setup complete! Your subscription products are ready.');

  } catch (error: any) {
    if (error.code === 'resource_already_exists') {
      console.log('⚠️  Products already exist. Fetching existing products...\n');
      
      const prices = await stripe.prices.list({
        active: true,
        type: 'recurring',
        expand: ['data.product'],
      });

      const enthusiast = prices.data.find(p => (p.product as Stripe.Product).name === 'BJJ Enthusiast');
      const gymPro = prices.data.find(p => (p.product as Stripe.Product).name === 'Gym Pro');

      if (enthusiast) {
        console.log('✅ BJJ Enthusiast found:');
        console.log(`   Price ID: ${enthusiast.id}`);
      }

      if (gymPro) {
        console.log('✅ Gym Pro found:');
        console.log(`   Price ID: ${gymPro.id}`);
      }

      if (enthusiast && gymPro) {
        console.log('\n📋 Add these to your .env file:');
        console.log(`STRIPE_ENTHUSIAST_PRICE_ID=${enthusiast.id}`);
        console.log(`STRIPE_GYM_PRO_PRICE_ID=${gymPro.id}`);
      }
    } else {
      console.error('❌ Error setting up products:', error.message);
      throw error;
    }
  }
}

setupStripeProducts();
