# AutoRAB X Mobile (Flutter)

Field management app: Attendance, Tasks, Leave, Reimbursement, Approval.

## Setup

```bash
# 1. Generate platform boilerplate (run once)
cd apps/mobile
flutter create . --project-name autoroba_mobile --org com.autoroba

# 2. Install dependencies
flutter pub get

# 3. Configure API URL (optional, defaults to 10.0.2.2:3001 for Android emulator)
# Set at build time:
flutter run --dart-define=API_URL=http://YOUR_SERVER:3001

# 4. Android: add permissions to android/app/src/main/AndroidManifest.xml
# (inside <manifest>)
# <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>
# <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION"/>
# <uses-permission android:name="android.permission.CAMERA"/>
# <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/>

# 5. iOS: add to ios/Runner/Info.plist
# NSLocationWhenInUseUsageDescription, NSCameraUsageDescription, NSPhotoLibraryUsageDescription
```

## Features
- GPS Check-in / Check-out (Absensi)
- Task list with progress update
- Leave request & cancellation (6 types)
- Reimbursement with camera/gallery receipt
- Manager approval for Leave & Reimbursement
