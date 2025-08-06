# Musika Biz - Business Music Streaming Platform

A comprehensive music streaming platform designed specifically for businesses in Indonesia, featuring LMK (Lembaga Manajemen Kolektif) royalty compliance and transparent payment systems.

## 🎵 Overview

Musika Biz addresses Indonesia's complex music licensing and royalty issues by providing a business-focused streaming platform that ensures proper LMK compliance and transparent royalty distribution to artists and rights holders.

## ✨ Key Features

### For Businesses
- **LMK Compliant Music Streaming**: Access to pre-cleared music with automatic royalty tracking
- **Business License Management**: Streamlined application and management of music licenses
- **Real-time Royalty Tracking**: Transparent tracking of music usage and associated costs
- **Business-specific Playlists**: Curated music collections for different business types (restaurants, retail, hotels, etc.)
- **Usage Analytics**: Detailed reports on music consumption and costs
- **Compliance Dashboard**: Real-time LMK compliance monitoring

### For Artists
- **Fair Royalty Distribution**: Transparent payment system with detailed breakdowns
- **LMK Integration**: Direct integration with Indonesia's collective management organization
- **Real-time Earnings**: Live tracking of royalty earnings from business plays
- **Analytics Dashboard**: Insights into where and how often music is played
- **Multiple Rights Holders**: Support for composers, lyricists, and publishers

### For Administrators
- **License Management**: Approve and manage business licenses
- **Royalty Processing**: Automated royalty calculations and payments
- **LMK Reporting**: Automated compliance reports to LMK
- **Platform Analytics**: Comprehensive platform usage and financial reports

## 🏗️ Architecture

### Backend (Node.js + Express)
- **Authentication & Authorization**: JWT-based with role-based access control
- **Database**: MongoDB with Mongoose ODM
- **File Storage**: Local file system with configurable paths
- **API Design**: RESTful APIs with comprehensive error handling
- **Security**: Helmet, CORS, rate limiting, and input validation

### Frontend (React + TypeScript)
- **State Management**: Zustand for application state
- **UI Framework**: Material-UI (MUI) for consistent design
- **Routing**: React Router with protected routes
- **Data Fetching**: React Query for server state management
- **Form Handling**: React Hook Form with Yup validation

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd musika-biz
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Configure the following environment variables:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   
   # Database
   MONGODB_URI=mongodb://localhost:27017/musika-biz
   
   # JWT Secret
   JWT_SECRET=your-super-secret-jwt-key-here
   
   # LMK Integration
   LMK_API_URL=https://api.lmk.or.id
   LMK_API_KEY=your-lmk-api-key
   LMK_ORGANIZATION_ID=your-organization-id
   
   # Payment Gateway
   PAYMENT_GATEWAY_URL=https://api.midtrans.com/v2
   PAYMENT_API_KEY=your-payment-api-key
   ```

4. **Start the application**
   ```bash
   npm run dev
   ```

   This will start both the backend server (port 5000) and React frontend (port 3000).

## 🎯 User Roles & Permissions

### Business Users
- Register company information and business type
- Apply for music licensing
- Stream LMK-compliant music
- View royalty reports and payments
- Manage business playlists

### Artists
- Upload music with LMK registration details
- Track royalty earnings in real-time
- Manage rights holder information
- Access detailed analytics

### Administrators
- Approve business licenses
- Process royalty payments
- Generate LMK compliance reports
- Manage platform users and content

## 📊 LMK Compliance Features

### Automated Royalty Calculation
- Per-play royalty rates based on business type
- Automatic distribution to rights holders
- LMK fee calculation (5% platform fee)
- Currency support (Indonesian Rupiah)

### Rights Holder Management
- Support for multiple composers, lyricists, and publishers
- Percentage-based revenue sharing
- LMK member number verification
- Bank account management for payments

### Compliance Reporting
- Automated monthly reports to LMK
- Real-time compliance score tracking
- Audit trail for all transactions
- Export capabilities for external reporting

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-based Access Control**: Granular permissions by user type
- **Rate Limiting**: API protection against abuse
- **Data Validation**: Input sanitization and validation
- **CORS Protection**: Cross-origin request security
- **Helmet Integration**: Security headers and protection

## 📱 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Music Management
- `GET /api/music` - Browse music library
- `POST /api/music/upload` - Upload new music (artists only)
- `GET /api/music/:id` - Get music details

### Royalty System
- `POST /api/royalty/play` - Record music play
- `GET /api/royalty/transactions` - Get royalty transactions
- `GET /api/royalty/summary` - Get royalty summary
- `GET /api/royalty/earnings` - Get artist earnings

### Business Management
- `GET /api/business/license` - Get license status
- `POST /api/business/license/apply` - Apply for license
- `GET /api/business/compliance` - Get compliance status

## 🛠️ Development

### Project Structure
```
├── server/
│   ├── models/         # Database models
│   ├── routes/         # API routes
│   ├── middleware/     # Custom middleware
│   └── index.js        # Server entry point
├── client/
│   ├── src/
│   │   ├── components/ # React components
│   │   ├── pages/      # Application pages
│   │   ├── services/   # API services
│   │   ├── store/      # State management
│   │   └── types/      # TypeScript types
│   └── public/         # Static assets
└── README.md
```

### Running Tests
```bash
# Backend tests
npm run test:server

# Frontend tests
npm run test:client

# All tests
npm test
```

### Building for Production
```bash
npm run build
```

## 🌟 Business Value Proposition

### For Indonesian Businesses
- **Legal Compliance**: Automatic LMK compliance without legal complexity
- **Cost Transparency**: Clear, predictable music licensing costs
- **Quality Music**: Access to verified, high-quality music content
- **Business Optimization**: Music selection tailored to business type and ambiance

### For Indonesian Artists
- **Fair Revenue**: Transparent, timely royalty payments
- **Market Access**: Direct access to business customers
- **Rights Protection**: Proper attribution and rights management
- **Growth Analytics**: Insights to understand audience and optimize content

### For the Indonesian Music Industry
- **Digital Transformation**: Modern platform for traditional royalty collection
- **Transparency**: Clear, auditable transaction records
- **Efficiency**: Automated processes reducing administrative overhead
- **Market Growth**: Expanded opportunities for music monetization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Email: support@musikabiz.com
- Documentation: [docs.musikabiz.com](https://docs.musikabiz.com)
- Issues: GitHub Issues

## 🔮 Roadmap

- [ ] Mobile application (iOS/Android)
- [ ] Advanced analytics and machine learning recommendations
- [ ] Integration with major music distributors
- [ ] Multi-language support (Bahasa Indonesia, English)
- [ ] Offline music playback capabilities
- [ ] Advanced playlist management tools
- [ ] API for third-party integrations

---

Built with ❤️ for the Indonesian music industry