# iOS In-App Purchase Setup Guide

This guide walks you through setting up in-app purchases for Jits Journal on iOS using RevenueCat and App Store Connect.

## Prerequisites

- ✅ RevenueCat Capacitor plugin installed (`@revenuecat/purchases-capacitor`)
- ✅ Active Apple Developer account
- ✅ App published to TestFlight or App Store
- ✅ RevenueCat account (free tier available)

## Step 1: Create In-App Purchase Products in App Store Connect

1. **Go to App Store Connect**: https://appstoreconnect.apple.com
2. Navigate to **My Apps** > **Jits Journal**
3. Click **In-App Purchases** in the sidebar
4. Click the **+** button to create a new subscription

### Create BJJ Enthusiast Subscription

1. Select **Auto-Renewable Subscription**
2. **Subscription Group**: Create new group called "Jits Journal Premium"
3. Fill in subscription details:
   - **Reference Name**: BJJ Enthusiast Monthly
   - **Product ID**: `com.jitsjournal.app.enthusiast.monthly`
   - **Subscription Duration**: 1 Month
   - **Price**: $9.99 USD (select all countries)

4. **Subscription Localization**:
   - **Display Name**: BJJ Enthusiast
   - **Description**: Unlimited class logs, unlimited notes, weekly community sharing, and priority support.

5. **Review Information**:
   - Upload a screenshot of the subscription benefits
   - Add review notes if needed

6. Click **Save**

### Create Gym Pro Subscription (Optional - Contact-Only)

Since Gym Pro requires manual approval, you can either:
- Create it as a separate product with higher price
- Keep it contact-only (current approach)

For now, we'll keep it contact-only since it requires approval.

## Step 2: Set Up RevenueCat

1. **Create RevenueCat Account**: https://app.revenuecat.com/signup
2. **Create Project**:
   - Project Name: Jits Journal
   - App Name: Jits Journal iOS
   - Bundle ID: `com.jitsjournal.app`

3. **Add App Store Connect API Key**:
   - In App Store Connect, go to **Users and Access** > **Keys** (under Integrations)
   - Create new key with **App Manager** access
   - Download the `.p8` file
   - In RevenueCat, go to **Project Settings** > **Apple App Store**
   - Upload the key

4. **Configure Products**:
   - Go to **Products** in RevenueCat dashboard
   - Click **+ New**
   - **Product ID**: `com.jitsjournal.app.enthusiast.monthly` (must match App Store Connect)
   - **Type**: Subscription
   - Click **Save**

5. **Create Entitlements**:
   - Go to **Entitlements**
   - Create entitlement: `enthusiast`
   - Attach product: `com.jitsjournal.app.enthusiast.monthly`
   - Click **Save**

6. **Create Offering**:
   - Go to **Offerings**
   - The "Current" offering is created by default
   - Click **+ Add Package**
   - **Package Type**: Monthly ($rc_monthly)
   - **Product**: Select `com.jitsjournal.app.enthusiast.monthly`
   - Click **Save**
   - Make sure offering is set to **Current**

## Step 3: Get RevenueCat API Keys

1. In RevenueCat dashboard, go to **Project Settings** > **API Keys**

2. Copy the **iOS SDK Key** (starts with `appl_`):
   - This is used by the iOS app to communicate with RevenueCat

3. Copy the **Secret API Key** (starts with `sk_`):
   - This is used by your backend server to verify subscriptions
   - **CRITICAL**: Keep this secret and never expose it to clients

4. Add both keys to your Replit Secrets or `.env` file:

```bash
# iOS SDK Key (public, used in mobile app)
VITE_REVENUECAT_IOS_SDK_KEY=appl_xxxxxxxxxxxxx

# Secret API Key (private, server-only, REQUIRED for security)
REVENUECAT_API_KEY=sk_xxxxxxxxxxxxx
```

**Security Note**: The `REVENUECAT_API_KEY` is critical for preventing subscription fraud. The backend uses this to verify all subscriptions server-side. Without it, users could fake premium access.

## Step 4: Test In-App Purchases

### Create Sandbox Tester Account

1. Go to **App Store Connect** > **Users and Access**
2. Click **Sandbox Testers** in sidebar
3. Click **+** to add tester
4. Fill in:
   - Email: Use a unique email (can be fake, like `test+iap1@yourdomain.com`)
   - Password: Create strong password
   - Country: United States (or your country)
5. Click **Save**

### Test on Device

1. **Sign out of production App Store** on your iOS device:
   - Settings > [Your Name] > Sign Out

2. **Install TestFlight build** with the IAP code

3. **Open Jits Journal** and navigate to Subscribe page

4. **Click "Get Started"** on BJJ Enthusiast plan

5. **Sign in with Sandbox Tester**:
   - When prompted for App Store sign-in, use your sandbox tester email/password
   - A banner will say "[Environment: Sandbox]" confirming you're in test mode

6. **Complete purchase**:
   - Payment will be instant (no charge to real card)
   - Subscription should activate immediately

7. **Verify**:
   - Check that app shows premium features unlocked
   - Check RevenueCat dashboard for the test purchase
   - Check your server logs for sync confirmation

## Step 5: Deploy to Production

1. **Push code to main branch**:
```bash
git add .
git commit -m "Add iOS in-app purchases with RevenueCat"
git push origin main
```

2. **Codemagic will build** and submit to TestFlight automatically

3. **Test thoroughly** before submitting for App Store Review

4. **Submit for Review**:
   - In App Store Connect, go to your app
   - Add screenshots, description, etc.
   - Submit for review

## Troubleshooting

### "No offerings available" error
- Check RevenueCat API key is correct
- Verify products are linked to entitlements
- Ensure "Current" offering exists and has packages

### "Product not found" error
- Verify Product ID matches exactly between App Store Connect and RevenueCat
- Wait 24 hours after creating products (App Store sync delay)
- Check Products are in "Ready to Submit" status

### Purchase fails silently
- Check Xcode logs for detailed error messages
- Verify sandbox tester is signed in
- Ensure device is using the correct build (TestFlight)

### Subscription doesn't sync to backend
- Check server logs for sync errors
- Verify `/api/sync-subscription` endpoint is working
- Check RevenueCat webhooks are configured (optional)

## Important Notes

### App Store Review Requirements

Apple requires:
1. **Restore Purchases button** - ✅ Already added to Subscribe page
2. **Terms of Service** - ✅ Already have at `/terms`
3. **Privacy Policy** - ✅ Already have at `/privacy`
4. **Clear subscription description** - ✅ Shown in Subscribe page
5. **No alternative payment mentions** - ✅ Only using IAP

### Price Changes

To change subscription price:
1. Create new product in App Store Connect with new price
2. Add product to RevenueCat
3. Update offering to use new product
4. Old subscribers keep old price (or migrate them manually)

### Subscription Management

Users can manage subscriptions in:
- iOS Settings > [Name] > Subscriptions
- App Store app > Account > Subscriptions

### Analytics

RevenueCat provides:
- Active subscriptions count
- Revenue charts
- Conversion rates
- Churn analysis

Access at: https://app.revenuecat.com/overview

## Support

- RevenueCat Docs: https://www.revenuecat.com/docs
- Apple IAP Guide: https://developer.apple.com/in-app-purchase/
- RevenueCat Slack: https://community.revenuecat.com/

## Summary

✅ **What we built**:
- Native iOS in-app purchase flow
- RevenueCat integration for cross-platform subscriptions
- Automatic sync to backend database
- Restore Purchases functionality
- Subscription status tracking

✅ **What you need to do**:
1. Create subscription products in App Store Connect
2. Configure RevenueCat with products and entitlements
3. Add `VITE_REVENUECAT_IOS_SDK_KEY` to environment
4. Test with sandbox tester account
5. Submit for App Store review

🎉 Your iOS app is ready for paid subscriptions!
