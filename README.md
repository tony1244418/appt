# TonyGamingTZ Admin Access Guide

## How to Access Admin Features

Your app has built-in admin functionality for managing messages and sending notifications. Here's how to access it:

### Step 1: Set Your Admin Phone Number

✅ **ALREADY CONFIGURED!**
- Admin phone number: `0612111793`
- Admin name: `TonyGamingTZ`
- Admin ID: `user_255612111793`

### Step 2: Login as Admin

1. Go to the **Messages** page in your app
2. Click "Join Chat Now"
3. Choose "Normal Login" 
4. Enter your phone number and username
5. Once logged in, you'll see admin features

### Step 3: Access Admin Panel

After logging in as admin, you'll see:

1. **Admin Panel Button** (A) in the top header
2. **Admin Panel** page at `/admin` route
3. **Enhanced chat interface** with admin privileges

## Admin Features Available

### 📱 Chat Management
- **View all conversations** from all users
- **Reply to specific users** or broadcast to everyone
- **Admin badge** showing you're official support
- **Conversation sidebar** to switch between users

### 🔔 Notification System
- **Send push notifications** to all users
- **Store notifications** in Firestore
- **Track notification delivery** and read status
- **Admin notification panel** at `/admin`

### 📞 Communication Tools
- **Voice calls** with users
- **Screen sharing** for support
- **File sharing** (images, documents, voice notes)
- **Real-time messaging** with typing indicators

### 🎮 User Management
- **See online users** count
- **Track user activity** and last seen
- **Guest and verified user** distinction
- **User conversation history**

## Quick Access URLs

- **Admin Panel**: `https://yourapp.com/admin`
- **Messages**: `https://yourapp.com/messages`
- **Direct Admin Login**: Use your phone number in the login form

## Admin Privileges

When logged in as admin, you get:

✅ **Special admin badge** and verification checkmark  
✅ **Access to all user conversations**  
✅ **Ability to send notifications**  
✅ **Enhanced chat interface**  
✅ **User management tools**  
✅ **Call and screen sharing capabilities**  

## Security Notes

- Only the phone number you set in `ADMIN_USER_ID` gets admin access
- All other users see you as "TonyGamingTZ Support" with verification badge
- Admin messages are highlighted in blue instead of red
- Secure authentication with phone number verification

## Troubleshooting

**Can't see admin features?**
1. Make sure you set the correct phone number in `chatService.ts`
2. Use the exact same phone number when logging in
3. Choose "Normal Login" not "Guest Access"

**Admin panel not showing?**
1. Check if you're logged in with the admin phone number
2. Look for the "A" button in the top header
3. Navigate directly to `/admin` route

Your admin system is ready to use! 🚀