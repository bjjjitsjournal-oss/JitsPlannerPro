# GitHub Actions iOS Build Setup

This workflow builds your iOS app using GitHub Actions' macOS runners.

## Prerequisites

You need an **Apple Developer Account** ($99/year) to create:
1. Distribution Certificate (.p12 file)
2. Provisioning Profile (.mobileprovision)
3. Team ID

## Setup Instructions

### Step 1: Export Distribution Certificate

1. Open **Xcode** on a Mac (or borrow one)
2. Go to **Xcode → Settings → Accounts**
3. Select your Apple ID → **Manage Certificates**
4. Right-click your **Apple Distribution** certificate → **Export**
5. Save as `.p12` with a password (remember this!)

### Step 2: Download Provisioning Profile

1. Go to [Apple Developer Portal](https://developer.apple.com/account/)
2. Navigate to **Certificates, IDs & Profiles → Profiles**
3. Create/download an **App Store** provisioning profile for `com.jitsjournal.app`

### Step 3: Convert to Base64

On Mac/Linux or PowerShell:

```powershell
# Convert certificate to base64
[Convert]::ToBase64String([IO.File]::ReadAllBytes("path\to\certificate.p12")) | Out-File certificate.txt

# Convert provisioning profile to base64
[Convert]::ToBase64String([IO.File]::ReadAllBytes("path\to\profile.mobileprovision")) | Out-File profile.txt
```

### Step 4: Add GitHub Secrets

Go to your GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**

Add these secrets:

| Secret Name | Value |
|-------------|-------|
| `IOS_CERTIFICATE_BASE64` | Contents of `certificate.txt` |
| `IOS_CERTIFICATE_PASSWORD` | Password you used when exporting .p12 |
| `IOS_PROVISION_PROFILE_BASE64` | Contents of `profile.txt` |
| `KEYCHAIN_PASSWORD` | Any random password (e.g., `TempKeychain123!`) |
| `APPLE_TEAM_ID` | Your Team ID from Apple Developer Portal |

### Step 5: Trigger Build

1. Push code to `main` branch, OR
2. Go to **Actions** tab → **Build iOS App** → **Run workflow**

The IPA file will be available in **Artifacts** after the build completes.

## Cost

- **Free tier**: 2,000 minutes/month
- **macOS multiplier**: 10x (so 200 actual build minutes free)
- Average iOS build: ~10-15 minutes = 100-150 minutes consumed

## Troubleshooting

- **Certificate issues**: Make sure you exported the **Distribution** certificate, not Development
- **Provisioning profile**: Must match your app's bundle ID (`com.jitsjournal.app`)
- **Build fails**: Check the Actions logs for specific Xcode errors
