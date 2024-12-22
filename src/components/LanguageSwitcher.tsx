import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [loading, setLoading] = useState(false);

  // Listen to language changes from Firebase
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'app'), (doc) => {
      if (doc.exists() && doc.data().language) {
        i18n.changeLanguage(doc.data().language);
      }
    });

    return () => unsubscribe();
  }, [i18n]);

  const handleLanguageChange = async (language: string) => {
    setLoading(true);
    try {
      const settingsRef = doc(db, 'settings', 'app');
      await setDoc(settingsRef, {
        language: language
      }, { merge: true });
    } catch (error) {
      console.error('Error updating language:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center space-x-4">
      <button
        onClick={() => handleLanguageChange('nl')}
        disabled={loading || i18n.language === 'nl'}
        className={`px-3 py-1 rounded ${
          i18n.language === 'nl' 
            ? 'bg-red-600 text-white' 
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        NL
      </button>
      <button
        onClick={() => handleLanguageChange('en')}
        disabled={loading || i18n.language === 'en'}
        className={`px-3 py-1 rounded ${
          i18n.language === 'en' 
            ? 'bg-red-600 text-white' 
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`}
      >
        EN
      </button>
    </div>
  );
} 