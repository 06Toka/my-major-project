import { db } from "../firebase"; // Adjust path based on your project structure
import { useState, useEffect, createContext, useContext } from 'react';
import './Settings.css';
import { 
  getAuth, 
  updateProfile as firebaseUpdateProfile, 
  updateEmail as firebaseUpdateEmail,
  deleteUser,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { getStorage, ref, deleteObject, listAll, uploadBytes, getDownloadURL } from 'firebase/storage';

const SettingsContext = createContext(null);

// Utility function to retry an operation with delay
const retryOperation = async (operation, maxAttempts = 3, delayMs = 1000) => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxAttempts || !error.message.includes('retry-limit-exceeded')) {
        throw error;
      }
      console.warn(`Attempt ${attempt} failed: ${error.message}. Retrying in ${delayMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
};

// Translation objects
const translations = {
  en: {
    profileSettings: "Profile Settings",
    editProfile: "Edit Profile",
    basicInformation: "Basic Information",
    username: "Username",
    email: "Email",
    phoneNumber: "Phone Number",
    farmDetails: "Farm Details",
    farmName: "Farm Name",
    location: "Location",
    farmSizeHectares: "Farm Size (hectares)",
    farmType: "Farm Type (select all that apply)",
    crops: "Crops (select all that apply)",
    livestock: "Livestock (select all that apply)",
    bioDescription: "Bio/Description",
    saveChanges: "Save Changes",
    cancel: "Cancel",
    userInformation: "User Information",
    farmInformation: "Farm Information",
    notProvided: "Not provided",
    security: "Security",
    changePassword: "Change Password",
    currentPassword: "Current Password",
    newPassword: "New Password",
    confirmNewPassword: "Confirm New Password",
    updatePassword: "Update Password",
    notificationSettings: "Notification Settings",
    emailNotifications: "Email Notifications",
    pushNotifications: "Push Notifications",
    smsNotifications: "SMS Notifications",
    alertTypes: "Alert Types",
    weatherAlerts: "Weather Alerts",
    marketPriceAlerts: "Market Price Alerts",
    pestsDiseaseAlerts: "Pests & Disease Alerts",
    preferences: "Preferences",
    measurementUnits: "Measurement Units",
    metric: "Metric (hectares, kg, km)",
    imperial: "Imperial (acres, lbs, miles)",
    language: "Language",
    theme: "Theme",
    switchToLightMode: "Switch to Light Mode",
    switchToDarkMode: "Switch to Dark Mode",
    dataManagement: "Data Management",
    exportData: "Export Data",
    downloadFarmData: "Download a copy of all your farm data",
    exportFarmDataButton: "Export Farm Data",
    backupSettings: "Backup Settings",
    createBackupDescription: "Create a backup of your settings and preferences",
    createBackupButton: "Create Backup",
    dangerZone: "Danger Zone",
    deleteAccount: "Delete Account",
    cancelDeletion: "Cancel Deletion",
    confirmAccountDeletion: "Confirm Account Deletion",
    deletionWarning: "This action cannot be undone. All your data will be permanently deleted.",
    confirmUsername: "Confirm Username",
    confirmEmail: "Confirm Email",
    permanentlyDeleteAccount: "Permanently Delete Account",
    support: "Support",
    contactSupport: "Contact Support",
    viewFAQs: "View FAQs",
    provideFeedback: "Provide Feedback",
    contactUs: "Contact Us",
    techSupportEmail: "For technical help, please contact us at support@farmhub.com",
    agriAdvicePhone: "For agricultural advice, call our experts at +266 58090971 (WhatsApp)",
    helpCenterLink: "Visit our help center at farmhub.com/help",
    about: "About",
    farmHub: "FarmHub",
    version: "Version 2.1.0",
    copyright: "© 2023 FarmHub Technologies. All rights reserved.",
    termsOfService: "Terms of Service",
    privacyPolicy: "Privacy Policy",
    openSourceLicenses: "Open Source Licenses",
    followUs: "Follow Us",
    loading: "Loading...",
    loginPrompt: "Please log in to access settings.",
    uploadImage: "Upload Image",
    usernameRequired: "Username is required",
    emailRequired: "Email is required",
    currentPasswordRequired: "Current password is required",
    passwordsDoNotMatch: "New passwords do not match",
    passwordLengthError: "New password must be at least 6 characters",
    profileUpdatedSuccess: "Profile updated successfully!",
    passwordUpdatedSuccess: "Password updated successfully!",
    profileImageUpdatedSuccess: "Profile image updated successfully!",
    dataExportedSuccess: "Data exported successfully!",
    backupCreatedSuccess: "Backup created successfully!",
    usernameEmailMismatch: "Username and email do not match",
    enterUsernameEmail: "Please enter both username and email",
    enterUsernameEmailPassword: "Please enter username, email, and password",
    enterPassword: "Enter your password",
    deleteConfirmation: "Are you sure you want to delete your account? This cannot be undone."
  },
  st: {
    profileSettings: "Litlhophiso tsa Profaele",
    editProfile: "Fetola Profaele",
    basicInformation: "Lintlha tsa Motheo",
    username: "Lebitso la Mosebelisi",
    email: "Imeile",
    phoneNumber: "Nomoro ea Mohala",
    farmDetails: "Lintlha tsa Polasi",
    farmName: "Lebitso la Polasi",
    location: "Sebaka",
    farmSizeHectares: "Boholo ba Polasi (lihekthere)",
    farmType: "Mofuta oa Polasi (khetha tsohle tse sebetsang)",
    crops: "Lijalo (khetha tsohle tse sebetsang)",
    livestock: "Liphoofolo tsa Liphoofolo (khetha tsohle tse sebetsang)",
    bioDescription: "Bio/Tlhaloso",
    saveChanges: "Boloka Liphetoho",
    cancel: "Hlakola",
    userInformation: "Lintlha tsa Mosebelisi",
    farmInformation: "Lintlha tsa Polasi",
    notProvided: "Ha ea fanoa",
    security: "Tšireletso",
    changePassword: "Fetola Phasewete",
    currentPassword: "Phasewete ea Hajoale",
    newPassword: "Phasewete e Ncha",
    confirmNewPassword: "Netefatsa Phasewete e Ncha",
    updatePassword: "Ntlafatsa Phasewete",
    notificationSettings: "Litlhophiso tsa Tsebiso",
    emailNotifications: "Litsebiso tsa Imeile",
    pushNotifications: "Litsebiso tsa Push",
    smsNotifications: "Litsebiso tsa SMS",
    alertTypes: "Mefuta ea Tlhokomeliso",
    weatherAlerts: "Litlhokomeliso tsa Boemo ba Leholimo",
    marketPriceAlerts: "Litlhokomeliso tsa Theko ea 'Maraka",
    pestsDiseaseAlerts: "Litlhokomeliso tsa Likokoanyana le Maloetse",
    preferences: "Likhetho",
    measurementUnits: "Litekanyo",
    metric: "Metric (lihekthere, kg, km)",
    imperial: "Imperial (li-acres, lbs, limaele)",
    language: "Puo",
    theme: "Sehlooho",
    switchToLightMode: "Fetola ho Leseli",
    switchToDarkMode: "Fetola ho Lefifi",
    dataManagement: "Ts'ebetso ea Lintlha",
    exportData: "Romela Lintlha",
    downloadFarmData: "Khoasolla kopi ea lintlha tsohle tsa polasi ea hau",
    exportFarmDataButton: "Romela Lintlha tsa Polasi",
    backupSettings: "Litlhophiso tsa Backup",
    createBackupDescription: "Theha backup ea litlhophiso le likhetho tsa hau",
    createBackupButton: "Theha Backup",
    dangerZone: "Sebaka sa Kotsi",
    deleteAccount: "Hlakola Ak'haonte",
    cancelDeletion: "Hlakola Tlhakolo",
    confirmAccountDeletion: "Netefatsa Tlhakolo ea Ak'haonte",
    deletionWarning: "Ketso ena e ke ke ea etsolloa. Lintlha tsohle tsa hau li tla hlakoloa ka ho sa feleng.",
    confirmUsername: "Netefatsa Lebitso la Mosebelisi",
    confirmEmail: "Netefatsa Imeile",
    permanentlyDeleteAccount: "Hlakola Ak'haonte ka ho sa Feleng",
    support: "Tšehetso",
    contactSupport: "Ikopanye le Tšehetso",
    viewFAQs: "Sheba FAQs",
    provideFeedback: "Fana ka Maikutlo",
    contactUs: "Ikopanye le Rona",
    techSupportEmail: "Bakeng sa thuso ea tekhenik'hale, ka kopo ikopanye le rona ho support@farmhub.com",
    agriAdvicePhone: "Bakeng sa likeletso tsa temo, letsetsa litsebi tsa rona ho +266 58090971 (WhatsApp)",
    helpCenterLink: "Etela setsi sa rona sa thuso ho farmhub.com/help",
    about: "Mabapi",
    farmHub: "FarmHub",
    version: "Mofuta oa 2.1.0",
    copyright: "© 2023 FarmHub Technologies. Litokelo tsohle li sirelelitsoe.",
    termsOfService: "Melao ea Tšebeletso",
    privacyPolicy: "Leano la Lekunutu",
    openSourceLicenses: "Lilaesense tsa Open Source",
    followUs: "Re Latele",
    loading: "E ntse e laela...",
    loginPrompt: "Ka kopo kena ho fumana litlhophiso.",
    uploadImage: "Kenya Setšoantšo",
    usernameRequired: "Lebitso la mosebelisi lea hlokahala",
    emailRequired: "Imeile ea hlokahala",
    currentPasswordRequired: "Phasewete ea hajoale ea hlokahala",
    passwordsDoNotMatch: "Liphasewete tse ncha ha li lumellane",
    passwordLengthError: "Phasewete e ncha e tlameha ho ba le bonyane litlhaku tse 6",
    profileUpdatedSuccess: "Profaele e ntlafalitsoe ka katleho!",
    passwordUpdatedSuccess: "Phasewete e ntlafalitsoe ka katleho!",
    profileImageUpdatedSuccess: "Setšoantšo sa profaele se ntlafalitsoe ka katleho!",
    dataExportedSuccess: "Lintlha li rometsoe ka katleho!",
    backupCreatedSuccess: "Backup e thehiloe ka katleho!",
    usernameEmailMismatch: "Lebitso la mosebelisi le imeile ha li lumellane",
    enterUsernameEmail: "Ka kopo kenya lebitso la mosebelisi le imeile",
    enterUsernameEmailPassword: "Ka kopo kenya lebitso la mosebelisi, imeile, le phasewete",
    enterPassword: "Kenya phasewete ea hau",
    deleteConfirmation: "Na u na le bonnete ba hore u batla ho hlakola ak'haonte ea hau? Sena se ke ke sa etsolloa."
  }
};

export const SettingsProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });
  const [notificationSettings, setNotificationSettings] = useState({
    email: true,
    push: true,
    sms: false,
    weatherAlerts: true,
    marketPriceAlerts: true,
    pestsAndDiseaseAlerts: true
  });
  const [measurementUnit, setMeasurementUnit] = useState(() => {
    return localStorage.getItem('measurementUnit') || 'metric';
  });
  const [language, setLanguage] = useState(() => {
    const storedLanguage = localStorage.getItem('language');
    console.log('Initial language from localStorage:', storedLanguage);
    return storedLanguage || 'en';
  });

  const auth = getAuth();
  const db = getFirestore();
  const storage = getStorage();

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('measurementUnit', measurementUnit);
    localStorage.setItem('language', language);
  }, [measurementUnit, language]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.notificationSettings) {
              setNotificationSettings(userData.notificationSettings);
            }
            setCurrentUser({
              ...user,
              ...userData
            });
          } else {
            const initialData = {
              displayName: user.displayName || '',
              email: user.email || '',
              phoneNumber: '',
              farmName: '',
              location: '',
              farmSize: '',
              farmType: [],
              crops: [],
              livestock: [],
              bio: '',
              profileImageUrl: '',
              notificationSettings: notificationSettings,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            };
            await setDoc(userDocRef, initialData);
            setCurrentUser({
              ...user,
              ...initialData
            });
          }
        } catch (error) {
          console.error('Error fetching or creating user data:', error);
          setCurrentUser(user);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth, db, notificationSettings]);

  const updateProfile = async (newProfileData) => {
    if (!currentUser) return { success: false, error: 'No user logged in' };
    
    try {
      setLoading(true);

      if (newProfileData.displayName !== currentUser.displayName) {
        await firebaseUpdateProfile(auth.currentUser, { displayName: newProfileData.displayName });
      }
      if (newProfileData.email && newProfileData.email !== currentUser.email) {
        await firebaseUpdateEmail(auth.currentUser, newProfileData.email);
      }

      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        ...newProfileData,
        updatedAt: serverTimestamp()
      });

      setCurrentUser({ ...currentUser, ...newProfileData });
      setLoading(false);
      return { success: true };
    } catch (error) {
      setLoading(false);
      console.error('Error updating profile:', error);
      return { success: false, error: error.message };
    }
  };

  const updateUserPassword = async (currentPassword, newPassword) => {
    if (!currentUser) return { success: false, error: 'No user logged in' };
    
    try {
      setLoading(true);
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPassword);
      
      setLoading(false);
      return { success: true, message: translations[language].passwordUpdatedSuccess };
    } catch (error) {
      setLoading(false);
      console.error('Error updating password:', error);
      return { success: false, error: error.message };
    }
  };

  const uploadProfileImage = async (file) => {
    if (!currentUser) return { success: false, error: 'No user logged in' };
    
    try {
      setLoading(true);
      const fileRef = ref(storage, `users/${currentUser.uid}/profile-image`);
      
      await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(fileRef);
      
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        profileImageUrl: downloadURL,
        updatedAt: serverTimestamp()
      });
      
      setCurrentUser({ ...currentUser, profileImageUrl: downloadURL });
      setLoading(false);
      return { success: true, url: downloadURL };
    } catch (error) {
      setLoading(false);
      console.error('Error uploading profile image:', error);
      return { success: false, error: error.message };
    }
  };

  const deleteUserData = async (currentPassword) => {
    if (!currentUser) return { success: false, error: 'No user logged in' };
    
    try {
      setLoading(true);
      const userId = currentUser.uid;
      let storageError = null;

      // Re-authenticate the user before deletion
      if (currentPassword) {
        const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
        await reauthenticateWithCredential(auth.currentUser, credential);
      } else {
        throw new Error('Password required for re-authentication');
      }

      // Delete storage files
      try {
        const userStorageRef = ref(storage, `users/${userId}`);
        const filesList = await listAll(userStorageRef);
        
        for (const fileRef of filesList.items) {
          await retryOperation(() => deleteObject(fileRef), 3, 1000).catch(err => {
            console.warn('Failed to delete file:', err.message);
            storageError = err.message;
          });
        }
      } catch (error) {
        console.warn('Error listing or deleting storage files:', error.message);
        storageError = error.message;
      }

      // Delete Firestore documents
      await deleteDoc(doc(db, 'users', userId)).catch(err => console.error('Error deleting user doc:', err));
      
      try {
        await deleteDoc(doc(db, 'farms', userId));
      } catch (error) {
        console.log('No farm data to delete:', error.message);
      }
      
      try {
        await deleteDoc(doc(db, 'inventory', userId));
      } catch (error) {
        console.log('No inventory data to delete:', error.message);
      }
      
      try {
        await deleteDoc(doc(db, 'orders', userId));
      } catch (error) {
        console.log('No orders data to delete:', error.message);
      }

      // Delete the authentication user
      await deleteUser(auth.currentUser);
      
      setLoading(false);
      setCurrentUser(null);
      
      if (storageError) {
        return { 
          success: true, 
          message: 'Account deleted successfully, but some files could not be removed from storage: ' + storageError 
        };
      }
      return { success: true, message: 'Account and all data deleted successfully' };
    } catch (error) {
      setLoading(false);
      console.error('Detailed error deleting data:', error);
      return { success: false, error: error.message || 'Failed to delete account. Please try again or contact support.' };
    }
  };

  const updateNotificationSettings = async (newSettings) => {
    if (!currentUser) return { success: false, error: 'No user logged in' };
    
    try {
      setLoading(true);
      
      const updatedSettings = { ...notificationSettings, ...newSettings };
      setNotificationSettings(updatedSettings);
      
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        notificationSettings: updatedSettings,
        updatedAt: serverTimestamp()
      });
      
      setLoading(false);
      return { success: true };
    } catch (error) {
      setLoading(false);
      console.error('Error updating notification settings:', error);
      return { success: false, error: error.message };
    }
  };

  const toggleDarkMode = () => {
    setDarkMode((prevMode) => !prevMode);
  };

  const changeMeasurementUnit = (unit) => {
    setMeasurementUnit(unit);
  };

  const changeLanguage = (lang) => {
    console.log('Changing language to:', lang);
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  useEffect(() => {
    console.log('Language state updated:', language);
  }, [language]);

  const value = {
    currentUser,
    loading,
    updateProfile,
    updatePassword: updateUserPassword,
    uploadProfileImage,
    deleteUserData,
    darkMode,
    toggleDarkMode,
    notificationSettings,
    updateNotificationSettings,
    measurementUnit,
    changeMeasurementUnit,
    language,
    changeLanguage
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const Settings = () => {
  const { 
    currentUser, 
    updateProfile, 
    updatePassword,
    uploadProfileImage,
    deleteUserData, 
    toggleDarkMode, 
    darkMode,
    notificationSettings,
    updateNotificationSettings,
    measurementUnit,
    changeMeasurementUnit,
    language,
    changeLanguage,
    loading
  } = useSettings();
  
  const t = translations[language] || translations['en'];

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [farmName, setFarmName] = useState('');
  const [location, setLocation] = useState('');
  const [farmSize, setFarmSize] = useState('');
  const [bio, setBio] = useState('');
  const [farmType, setFarmType] = useState([]);
  const [crops, setCrops] = useState([]);
  const [livestock, setLivestock] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [isDeleteFormVisible, setIsDeleteFormVisible] = useState(false);
  const [usernameForDelete, setUsernameForDelete] = useState('');
  const [emailForDelete, setEmailForDelete] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [showContactDetails, setShowContactDetails] = useState(false);

  const farmTypeOptions = {
    en: ['Crop Farming', 'Livestock', 'Mixed Farming', 'Organic Farming', 'Poultry', 'Dairy', 'Aquaculture', 'Greenhouse', 'Other'],
    st: ['Temo ea Lijalo', 'Liphoofolo', 'Temo e Kopaneng', 'Temo ea Organic', 'Likokoanyana', 'Lebese', 'Tlhapi', 'Greenhouse', 'Tse ling']
  };
  
  const cropOptions = {
    en: ['Maize', 'Wheat', 'Rice', 'Potatoes', 'Tomatoes', 'Cabbage', 'Onions', 'Carrots', 'Beans', 'Peas', 'Sorghum', 'Soybeans', 'Other'],
    st: ['Poone', 'Koro', 'Raese', 'Litapole', 'Litamati', 'Khabeche', 'Eie', 'Lihoete', 'Linaoa', 'Lierekisi', 'Mabele', 'Soya', 'Tse ling']
  };
  
  const livestockOptions = {
    en: ['Cattle', 'Goats', 'Sheep', 'Pigs', 'Chickens', 'Ducks', 'Fish', 'Bees', 'Other'],
    st: ['Likhou', 'Lipoli', 'Linku', 'Likolobe', 'Likoko', 'Matata', 'Litlhapi', 'Linotši', 'Tse ling']
  };
  
  const languageOptions = [
    { code: 'en', name: 'English' },
    { code: 'st', name: 'Sesotho' },
    { code: 'xh', name: 'isiXhosa' },
    { code: 'zu', name: 'isiZulu' },
    { code: 'af', name: 'Afrikaans' },
    { code: 'fr', name: 'French' },
    { code: 'pt', name: 'Portuguese' }
  ];

  useEffect(() => {
    if (currentUser) {
      setDisplayName(currentUser.displayName || '');
      setEmail(currentUser.email || '');
      setPhoneNumber(currentUser.phoneNumber || '');
      setFarmName(currentUser.farmName || '');
      setLocation(currentUser.location || '');
      setFarmSize(currentUser.farmSize || '');
      setBio(currentUser.bio || '');
      setFarmType(currentUser.farmType || []);
      setCrops(currentUser.crops || []);
      setLivestock(currentUser.livestock || []);
    }
  }, [currentUser]);

  useEffect(() => {
    console.log('Current language in Settings component:', language);
  }, [language]);

  const handleProfileImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setProfileImage(e.target.files[0]);
    }
  };

  const handleProfileImageUpload = async () => {
    if (!profileImage) {
      setErrorMessage(t.selectImageFirst || 'Please select an image first');
      return;
    }
    
    const result = await uploadProfileImage(profileImage);
    if (result.success) {
      setSuccessMessage(t.profileImageUpdatedSuccess);
      setProfileImage(null);
    } else {
      setErrorMessage(result.error || t.errorUploadingImage || 'Error uploading profile image');
    }
    setTimeout(() => {
      setSuccessMessage('');
      setErrorMessage('');
    }, 5000);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    
    if (!displayName.trim()) {
      setErrorMessage(t.usernameRequired);
      return;
    }
    if (!email.trim()) {
      setErrorMessage(t.emailRequired);
      return;
    }

    const profileData = { 
      displayName, 
      email, 
      phoneNumber,
      farmName,
      location,
      farmSize: farmSize ? parseFloat(farmSize) : '',
      bio,
      farmType,
      crops,
      livestock
    };
    
    const result = await updateProfile(profileData);
    if (result.success) {
      setSuccessMessage(t.profileUpdatedSuccess);
      setIsEditing(false);
    } else {
      setErrorMessage(result.error || t.errorUpdatingProfile || 'Error updating profile');
    }
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    
    if (!currentPassword) {
      setErrorMessage(t.currentPasswordRequired);
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage(t.passwordsDoNotMatch);
      return;
    }
    if (newPassword.length < 6) {
      setErrorMessage(t.passwordLengthError);
      return;
    }
    
    const result = await updatePassword(currentPassword, newPassword);
    if (result.success) {
      setSuccessMessage(t.passwordUpdatedSuccess);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsChangingPassword(false);
    } else {
      setErrorMessage(result.error || t.errorUpdatingPassword || 'Error updating password');
    }
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    
    if (!usernameForDelete || !emailForDelete || !deletePassword) {
      setErrorMessage(t.enterUsernameEmailPassword);
      return;
    }
    
    if (usernameForDelete === currentUser.displayName && emailForDelete === currentUser.email) {
      if (window.confirm(t.deleteConfirmation)) {
        const result = await deleteUserData(deletePassword);
        if (result.success) {
          setSuccessMessage(result.message);
          setTimeout(() => {
            setSuccessMessage('');
          }, 3000);
        } else {
          setErrorMessage(result.error);
          setTimeout(() => setErrorMessage(''), 5000);
        }
      }
    } else {
      setErrorMessage(t.usernameEmailMismatch);
    }
  };

  const toggleDeleteForm = () => {
    setIsDeleteFormVisible(!isDeleteFormVisible);
    setUsernameForDelete('');
    setEmailForDelete('');
    setDeletePassword('');
    setErrorMessage('');
  };

  const handleSupport = () => {
    setShowContactDetails(!showContactDetails);
  };

  const handleToggleOption = (option, array, setArray) => {
    if (array.includes(option)) {
      setArray(array.filter(item => item !== option));
    } else {
      setArray([...array, option]);
    }
  };

  const handleNotificationChange = async (setting, value) => {
    const result = await updateNotificationSettings({ [setting]: value });
    if (!result.success) {
      setErrorMessage(t.errorUpdatingNotifications || 'Error updating notification settings');
      setTimeout(() => setErrorMessage(''), 5000);
    }
  };

  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    console.log('Selected language:', newLanguage);
    changeLanguage(newLanguage);
  };

  const handleExportData = async () => {
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      const data = userDoc.exists() ? userDoc.data() : {};
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `farmhub-data-${currentUser.uid}.json`;
      link.click();
      window.URL.revokeObjectURL(url);
      
      setSuccessMessage(t.dataExportedSuccess);
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error) {
      setErrorMessage(t.errorExportingData || 'Error exporting data');
      setTimeout(() => setErrorMessage(''), 5000);
    }
  };

  const handleCreateBackup = () => {
    const backupData = {
      darkMode,
      notificationSettings,
      measurementUnit,
      language,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `farmhub-backup-${currentUser.uid}.json`;
    link.click();
    window.URL.revokeObjectURL(url);
    
    setSuccessMessage(t.backupCreatedSuccess);
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  if (loading) return <div className="settings-container">{t.loading}</div>;
  if (!currentUser) return <div className="settings-container">{t.loginPrompt}</div>;

  return (
    <div className="settings-container">
      {successMessage && <div className="success-message">{successMessage}</div>}
      {errorMessage && <div className="error-message">{errorMessage}</div>}
      
      <section className="profile-section">
        <h2>{t.profileSettings}</h2>
        
        <div className="profile-image-container">
          {currentUser.profileImageUrl ? (
            <img 
              src={currentUser.profileImageUrl} 
              alt="Profile" 
              className="profile-image" 
            />
          ) : (
            <div className="profile-image-placeholder">
              {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'U'}
            </div>
          )}
          <div className="profile-image-upload">
            <input 
              type="file" 
              id="profile-image" 
              accept="image/*" 
              onChange={handleProfileImageChange} 
            />
            {profileImage && (
              <button onClick={handleProfileImageUpload}>{t.uploadImage}</button>
            )}
          </div>
        </div>

        {isEditing ? (
          <form className="form-group" onSubmit={handleUpdateProfile}>
            <div className="edit-header">
              <button 
                type="button" 
                className="back-arrow" 
                onClick={() => setIsEditing(false)}
                aria-label="Back to profile view"
              >
                ←
              </button>
              <h3>{t.editProfile}</h3>
            </div>
            <h3>{t.basicInformation}</h3>
            <label>{t.username}</label>
            <input 
              type="text" 
              value={displayName} 
              onChange={(e) => setDisplayName(e.target.value)}
            />
            <label>{t.email}</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
            />
            <label>{t.phoneNumber}</label>
            <input 
              type="text" 
              value={phoneNumber} 
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
            
            <h3>{t.farmDetails}</h3>
            <label>{t.farmName}</label>
            <input 
              type="text" 
              value={farmName} 
              onChange={(e) => setFarmName(e.target.value)}
            />
            <label>{t.location}</label>
            <input 
              type="text" 
              value={location} 
              onChange={(e) => setLocation(e.target.value)}
            />
            <label>{t.farmSizeHectares}</label>
            <input 
              type="text" 
              value={farmSize} 
              onChange={(e) => setFarmSize(e.target.value)}
            />
            
            <label>{t.farmType}</label>
            <div className="checkbox-group">
              {farmTypeOptions[language]?.map(option => (
                <div key={option} className="checkbox-item">
                  <input
                    type="checkbox"
                    id={`farm-type-${option}`}
                    checked={farmType.includes(option)}
                    onChange={() => handleToggleOption(option, farmType, setFarmType)}
                  />
                  <label htmlFor={`farm-type-${option}`}>{option}</label>
                </div>
              ))}
            </div>
            
            <label>{t.crops}</label>
            <div className="checkbox-group">
              {cropOptions[language]?.map(option => (
                <div key={option} className="checkbox-item">
                  <input
                    type="checkbox"
                    id={`crop-${option}`}
                    checked={crops.includes(option)}
                    onChange={() => handleToggleOption(option, crops, setCrops)}
                  />
                  <label htmlFor={`crop-${option}`}>{option}</label>
                </div>
              ))}
            </div>
            
            <label>{t.livestock}</label>
            <div className="checkbox-group">
              {livestockOptions[language]?.map(option => (
                <div key={option} className="checkbox-item">
                  <input
                    type="checkbox"
                    id={`livestock-${option}`}
                    checked={livestock.includes(option)}
                    onChange={() => handleToggleOption(option, livestock, setLivestock)}
                  />
                  <label htmlFor={`livestock-${option}`}>{option}</label>
                </div>
              ))}
            </div>
            
            <label>{t.bioDescription}</label>
            <textarea 
              value={bio} 
              onChange={(e) => setBio(e.target.value)}
              rows={4}
            />
            
            <div className="button-group">
              <button type="submit">{t.saveChanges}</button>
              <button type="button" onClick={() => setIsEditing(false)}>{t.cancel}</button>
            </div>
          </form>
        ) : (
          <div className="profile-info">
            <div className="info-group">
              <h3>{t.userInformation}</h3>
              <p><strong>{t.username}:</strong> {displayName}</p>
              <p><strong>{t.email}:</strong> {email}</p>
              <p><strong>{t.phoneNumber}:</strong> {phoneNumber || t.notProvided}</p>
            </div>
            
            {farmName && (
              <div className="info-group">
                <h3>{t.farmInformation}</h3>
                <p><strong>{t.farmName}:</strong> {farmName}</p>
                <p><strong>{t.location}:</strong> {location || t.notProvided}</p>
                <p><strong>{t.farmSizeHectares}:</strong> {farmSize ? `${farmSize} hectares` : t.notProvided}</p>
                
                {farmType.length > 0 && (
                  <p><strong>{t.farmType}:</strong> {farmType.join(', ')}</p>
                )}
                
                {crops.length > 0 && (
                  <p><strong>{t.crops}:</strong> {crops.join(', ')}</p>
                )}
                
                {livestock.length > 0 && (
                  <p><strong>{t.livestock}:</strong> {livestock.join(', ')}</p>
                )}
                
                {bio && (
                  <>
                    <p><strong>{t.bioDescription}:</strong></p>
                    <p className="bio-text">{bio}</p>
                  </>
                )}
              </div>
            )}
            
            <button className="edit-button" onClick={() => setIsEditing(true)}>
              {t.editProfile}
            </button>
          </div>
        )}
      </section>
      
      <section className="security-section">
        <h2>{t.security}</h2>
        
        {isChangingPassword ? (
          <form className="form-group" onSubmit={handlePasswordChange}>
            <label>{t.currentPassword}</label>
            <input 
              type="password" 
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
            
            <label>{t.newPassword}</label>
            <input 
              type="password" 
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            
            <label>{t.confirmNewPassword}</label>
            <input 
              type="password" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            
            <div className="button-group">
              <button type="submit">{t.updatePassword}</button>
              <button type="button" onClick={() => setIsChangingPassword(false)}>{t.cancel}</button>
            </div>
          </form>
        ) : (
          <button onClick={() => setIsChangingPassword(true)}>{t.changePassword}</button>
        )}
      </section>
      
      <section className="notifications-section">
        <h2>{t.notificationSettings}</h2>
        
        <div className="form-group">
          <div className="setting-toggle">
            <label htmlFor="email-notifications">{t.emailNotifications}</label>
            <input 
              type="checkbox" 
              id="email-notifications" 
              checked={notificationSettings.email}
              onChange={(e) => handleNotificationChange('email', e.target.checked)}
            />
          </div>
          
          <div className="setting-toggle">
            <label htmlFor="push-notifications">{t.pushNotifications}</label>
            <input 
              type="checkbox" 
              id="push-notifications" 
              checked={notificationSettings.push}
              onChange={(e) => handleNotificationChange('push', e.target.checked)}
            />
          </div>
          
          <div className="setting-toggle">
            <label htmlFor="sms-notifications">{t.smsNotifications}</label>
            <input 
              type="checkbox" 
              id="sms-notifications" 
              checked={notificationSettings.sms}
              onChange={(e) => handleNotificationChange('sms', e.target.checked)}
            />
          </div>
          
          <h3>{t.alertTypes}</h3>
          
          <div className="setting-toggle">
            <label htmlFor="weather-alerts">{t.weatherAlerts}</label>
            <input 
              type="checkbox" 
              id="weather-alerts" 
              checked={notificationSettings.weatherAlerts}
              onChange={(e) => handleNotificationChange('weatherAlerts', e.target.checked)}
            />
          </div>
          
          <div className="setting-toggle">
            <label htmlFor="market-price-alerts">{t.marketPriceAlerts}</label>
            <input 
              type="checkbox" 
              id="market-price-alerts" 
              checked={notificationSettings.marketPriceAlerts}
              onChange={(e) => handleNotificationChange('marketPriceAlerts', e.target.checked)}
            />
          </div>
          
          <div className="setting-toggle">
            <label htmlFor="pests-disease-alerts">{t.pestsDiseaseAlerts}</label>
            <input 
              type="checkbox" 
              id="pests-disease-alerts" 
              checked={notificationSettings.pestsAndDiseaseAlerts}
              onChange={(e) => handleNotificationChange('pestsAndDiseaseAlerts', e.target.checked)}
            />
          </div>
        </div>
      </section>
      
      <section className="preferences-section">
        <h2>{t.preferences}</h2>
        
        <div className="form-group">
          <h3>{t.measurementUnits}</h3>
          <div className="radio-group">
            <div className="radio-item">
              <input 
                type="radio" 
                id="metric" 
                name="unit" 
                value="metric"
                checked={measurementUnit === 'metric'}
                onChange={() => changeMeasurementUnit('metric')}
              />
              <label htmlFor="metric">{t.metric}</label>
            </div>
            
            <div className="radio-item">
              <input 
                type="radio" 
                id="imperial" 
                name="unit" 
                value="imperial"
                checked={measurementUnit === 'imperial'}
                onChange={() => changeMeasurementUnit('imperial')}
              />
              <label htmlFor="imperial">{t.imperial}</label>
            </div>
          </div>
          
          <h3>{t.language}</h3>
          <select 
            value={language || 'en'}
            onChange={handleLanguageChange}
            className="language-select"
            aria-label="Select Language"
          >
            {languageOptions.map(option => (
              <option 
                key={option.code} 
                value={option.code}
              >
                {option.name}
              </option>
            ))}
          </select>
          <p>{t.currentLanguage}: {languageOptions.find(opt => opt.code === language)?.name || 'Unknown'}</p>
        </div>
      </section>
      
      <section className="theme-settings">
        <h2>{t.theme}</h2>
        <button className="dark-mode-toggle" onClick={toggleDarkMode}>
          {darkMode ? t.switchToLightMode : t.switchToDarkMode}
        </button>
      </section>

      <section className="data-management">
        <h2>{t.dataManagement}</h2>
        
        <div className="data-options">
          <div className="data-option">
            <h3>{t.exportData}</h3>
            <p>{t.downloadFarmData}</p>
            <button onClick={handleExportData}>{t.exportFarmDataButton}</button>
          </div>
          
          <div className="data-option">
            <h3>{t.backupSettings}</h3>
            <p>{t.createBackupDescription}</p>
            <button onClick={handleCreateBackup}>{t.createBackupButton}</button>
          </div>
        </div>
        
        <div className="danger-zone">
          <h3>{t.dangerZone}</h3>
          <button className="delete-button" onClick={toggleDeleteForm}>
            {isDeleteFormVisible ? t.cancelDeletion : t.deleteAccount}
          </button>

          {isDeleteFormVisible && (
            <form className="delete-form" onSubmit={handleDeleteAccount}>
              <h3>{t.confirmAccountDeletion}</h3>
              <p>{t.deletionWarning}</p>
              
              <label>{t.confirmUsername}</label>
              <input
                type="text"
                value={usernameForDelete}
                onChange={(e) => setUsernameForDelete(e.target.value)}
                placeholder={t.enterUsername || "Enter your username"}
              />
              
              <label>{t.confirmEmail}</label>
              <input
                type="email"
                value={emailForDelete}
                onChange={(e) => setEmailForDelete(e.target.value)}
                placeholder={t.enterEmail || "Enter your email"}
              />
              
              <label>{t.currentPassword}</label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder={t.enterPassword}
              />
              
              <button type="submit" className="delete-confirm-button">
                {t.permanentlyDeleteAccount}
              </button>
            </form>
          )}
        </div>
      </section>

      <section className="support-section">
        <h2>{t.support}</h2>
        <div className="support-options">
          <button className="support-button" onClick={handleSupport}>
            {t.contactSupport}
          </button>
          
          <button className="faq-button">
            {t.viewFAQs}
          </button>
          
          <button className="feedback-button">
            {t.provideFeedback}
          </button>
        </div>

        {showContactDetails && (
          <div className="contact-details">
            <h3>{t.contactUs}</h3>
            <p>
              {t.techSupportEmail.split('support@farmhub.com')[0]}
              <a href="mailto:support@farmhub.com">support@farmhub.com</a>
            </p>
            <p>
              {t.agriAdvicePhone.split('+266 58090971')[0]}
              <a href="tel:+26658090971">+266 58090971 (WhatsApp)</a>
            </p>
            <p>
              {t.helpCenterLink.split('farmhub.com/help')[0]}
              <a href="https://farmhub.com/help" target="_blank" rel="noopener noreferrer">
                farmhub.com/help
              </a>
            </p>
          </div>
        )}
      </section>
      
      <section className="about-section">
        <h2>{t.about}</h2>
        <div className="about-content">
          <div className="app-info">
            <h3>{t.farmHub}</h3>
            <p>{t.version}</p>
            <p>{t.copyright}</p>
          </div>
          
          <div className="legal-links">
            <a href="/terms" target="_blank" rel="noopener noreferrer">{t.termsOfService}</a>
            <a href="/privacy" target="_blank" rel="noopener noreferrer">{t.privacyPolicy}</a>
            <a href="/licenses" target="_blank" rel="noopener noreferrer">{t.openSourceLicenses}</a>
          </div>
          
          <div className="social-links">
            <h3>{t.followUs}</h3>
            <div className="social-icons">
              <a href="https://facebook.com/farmhub" target="_blank" rel="noopener noreferrer">
                <i className="fab fa-facebook"></i>
              </a>
              <a href="https://twitter.com/farmhub" target="_blank" rel="noopener noreferrer">
                <i className="fab fa-twitter"></i>
              </a>
              <a href="https://instagram.com/farmhub" target="_blank" rel="noopener noreferrer">
                <i className="fab fa-instagram"></i>
              </a>
              <a href="https://youtube.com/farmhub" target="_blank" rel="noopener noreferrer">
                <i className="fab fa-youtube"></i>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Settings;
