# Quick Setup Guide

## 🚀 Getting Started

This car sale system is now ready to use! Follow these steps to get it running:

### 1. Install Dependencies (if not already done)
```bash
npm install
```

### 2. Configure Firebase
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Authentication (Email/Password)
4. Create a Firestore database
5. Update `src/services/firebase.ts` with your config

### 3. Configure Cloudinary
1. Create account at [Cloudinary](https://cloudinary.com/)
2. Create upload preset named "car_images"
3. Update `src/services/cloudinary.ts` with your config

### 4. Start Development Server
```bash
npm start
```

### 5. Access the Application
- Open http://localhost:3000
- Register a new user account or use admin credentials:
  - Email: admin@carsale.com
  - Password: admin123456

## 📋 Features Included

✅ **User Authentication**
- Admin login with fixed credentials
- User registration and login
- Role-based access control

✅ **Vehicle Management**
- Add vehicles with 4 images
- Complete vehicle details
- Search functionality
- Status tracking (Available/Sold/Reserved)

✅ **Financial Tracking**
- Tax and duty calculations
- Payment tracking
- Profit calculations
- Admin can see actual amounts

✅ **Admin Features**
- View all vehicles
- Edit any vehicle
- Delete vehicles
- Manage tax/duty rates

✅ **User Features**
- Add personal vehicles
- View own vehicles
- See profit status (without actual amounts)

## 🔧 Configuration Required

1. **Firebase Setup**: Replace placeholder config in `src/services/firebase.ts`
2. **Cloudinary Setup**: Replace placeholder config in `src/services/cloudinary.ts`
3. **Firestore Rules**: Set up security rules as per README.md
4. **Tax/Duty Config**: Add initial tax rates to Firestore

## 📁 Project Structure

```
src/
├── components/          # Reusable components
├── pages/              # Main page components
├── services/           # Firebase & Cloudinary services
├── context/            # React context (Auth)
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── App.tsx             # Main application component
```

## 🏃‍♂️ Next Steps

1. Configure Firebase and Cloudinary
2. Set up Firestore security rules
3. Add initial tax/duty configurations
4. Test the application
5. Deploy to production

## 🆘 Need Help?

Check the detailed README.md file for complete setup instructions and troubleshooting.
