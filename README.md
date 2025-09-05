# CarSale - Modern Vehicle Management System

A comprehensive vehicle import company management system built with React, TypeScript, Firebase, and Cloudinary. Features modern Volvo EX30-inspired UI design with complete financial tracking in Sri Lankan Rupees (LKR).

## 🚀 Features

### Vehicle Management
- **Complete Vehicle Information**: Chassis number, brand, model, year, grade, country
- **Financial Tracking**: Purchase price, CIF value, LC value, selling price in LKR
- **Shipping Management**: Company details, shipping and arrival dates
- **Purchaser Details**: Complete customer information management
- **Image Gallery**: Multiple vehicle photos with Cloudinary integration
- **Status Tracking**: Available, sold, pending, reserved statuses

### Enhanced Vehicle Details
- **Section-based Editing**: Edit Basic Info, Financial Info, Shipping Info, and Purchaser Details separately
- **Real-time Calculations**: Auto-calculated net profit and rest payments
- **Permission-based Access**: Admins and vehicle owners can edit
- **Professional UI**: Clean, modern interface with smooth transitions

### Financial Management (LKR)
- **Sri Lankan Rupees**: Complete localization with LKR currency
- **Simplified Calculations**: Focus on core financial values without complex tax/duty
- **Profit Tracking**: Net Profit = Selling Price - CIF Value
- **Payment Management**: Track advance payments and remaining amounts

### User Management
- **Admin Access**: Complete system management
- **User Registration**: Self-service user registration
- **Role-based Permissions**: Different access levels for admin and users

### Modern UI/UX
- **Volvo EX30 Design**: Modern, minimalistic interface
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Dark/Light Compatible**: Clean color scheme
- **Smooth Animations**: Professional transitions and interactions

## 🛠 Technical Stack

- **Frontend**: React 18 with TypeScript
- **Backend**: Firebase (Authentication + Firestore)
- **Image Storage**: Cloudinary
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM
- **Deployment**: GitHub Pages ready

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Firebase account
- Cloudinary account
- Git and GitHub account

## 🚀 Quick Start

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/carsale.git
cd carsale

# Install dependencies
npm install
```

### 2. Firebase Setup

1. Create a Firebase project at https://console.firebase.google.com/
2. Enable Authentication (Email/Password)
3. Create a Firestore database
4. Update `src/services/firebase.ts` with your Firebase config

### 3. Cloudinary Setup

1. Create account at https://cloudinary.com/
2. Create upload preset named "car_images" (unsigned)
3. Update `src/services/cloudinary.ts` with your config

### 4. Run the Application

```bash
npm start
```

The application will open at `http://localhost:3000`

## 📱 Usage

### Admin Access
- Email: `admin@carsale.com`
- Password: `admin123456`

### Adding Vehicles
1. Navigate to "Add Vehicle"
2. Fill in vehicle details with financial information
3. Add shipping and purchaser details (optional)
4. Upload vehicle images
5. System auto-calculates profit and payments

### Managing Vehicles
- **Dashboard**: Overview of all vehicles with profit tracking
- **Search**: Filter by brand, model, chassis, or status
- **Details View**: Complete vehicle information with editing capabilities
- **Financial Tracking**: Real-time LKR calculations

## 🌐 GitHub Deployment

### Setup GitHub Pages

1. **Create GitHub Repository**
2. **Push Code to GitHub**
3. **Enable GitHub Pages**
4. **Configure Deployment**

The project is pre-configured with:
- `homepage` in package.json
- Deploy scripts for GitHub Pages
- Automated build process

### Deploy Commands

```bash
# Build and deploy to GitHub Pages
npm run deploy

# Manual build
npm run build
```

## 🏗 Database Structure

### Vehicle Document
```typescript
{
  id: string,
  chassisNumber: string,
  brand: string,
  model: string,
  year: number,
  grade: string,
  country: string,
  
  // Financial Information (LKR)
  purchasePrice: number,
  cifValue: number,
  lcValue: number,
  sellingPrice: number,
  netProfit: number, // Auto-calculated
  advancePayment: number,
  restPayment: number, // Auto-calculated
  
  // Shipping Information
  shippingCompany?: string,
  shippingDate?: Date,
  arrivalDate?: Date,
  
  // Purchaser Details
  purchaserName?: string,
  purchaserPhone?: string,
  purchaserIdNumber?: string,
  purchaserAddress?: string,
  
  images: string[],
  addedBy: string,
  createdAt: Date,
  updatedAt: Date,
  status: 'available' | 'sold' | 'pending' | 'reserved'
}
```

## 🔧 Configuration

### Environment Variables (Optional)
```env
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_CLOUDINARY_CLOUD_NAME=your-cloud-name
```

### Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /vehicles/{vehicleId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        (resource.data.addedBy == request.auth.uid || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "admin");
    }
  }
}
```

## 🎯 Key Features Implemented

✅ **Modern Navigation**: Volvo EX30-inspired design  
✅ **LKR Currency**: Complete Sri Lankan Rupee integration  
✅ **Financial Tracking**: Purchase, CIF, LC, selling prices  
✅ **Enhanced Vehicle Details**: Section-based editing  
✅ **Shipping Management**: Company and date tracking  
✅ **Purchaser Management**: Customer information system  
✅ **Real-time Calculations**: Auto-computed profits and payments  
✅ **GitHub Pages Ready**: Pre-configured deployment  
✅ **Responsive Design**: Mobile-friendly interface  
✅ **Image Management**: Multiple photo support  

## 🔮 Future Enhancements

- [ ] Advanced Analytics with brand/model tracking
- [ ] Monthly/Annual sales reports
- [ ] Time-based filtering (1,3,6 months)
- [ ] Email notifications
- [ ] Data export functionality
- [ ] Multi-language support
- [ ] Advanced search filters
- [ ] Inventory reports

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is proprietary software for vehicle import company use.

## 📞 Support

For issues and support, please create an issue in the repository.

---

**Built with ❤️ for modern vehicle management**
