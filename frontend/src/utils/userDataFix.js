/**
 * Helper utility to fix user data issues
 */

/**
 * Fix isowner field to ensure it's a number not a string
 * @param {Object} userData - The user data from the API
 * @returns {Object} - Fixed user data
 */
export const fixUserData = (userData) => {
  if (!userData) return userData;
  
  // Create a copy to avoid mutating the original
  const fixedData = { ...userData };
  
  // Fix isowner field
  if (fixedData.isowner !== undefined) {
    if (typeof fixedData.isowner === 'string') {
      // Convert string to number
      fixedData.isowner = parseInt(fixedData.isowner) || 0;
    } else if (typeof fixedData.isowner === 'boolean') {
      // Convert boolean to number
      fixedData.isowner = fixedData.isowner ? 1 : 0;
    }
  }
  
  return fixedData;
};

/**
 * Apply the fix to user data automatically in localStorage
 */
export const applyUserDataFix = () => {
  try {
    // Check if we have user data in localStorage
    const userDataStr = localStorage.getItem('userData');
    if (userDataStr) {
      const userData = JSON.parse(userDataStr);
      const fixedData = fixUserData(userData);
      
      // Only update if there was a change
      if (JSON.stringify(userData) !== JSON.stringify(fixedData)) {
        console.log('Fixed user data in localStorage (isowner type)');
        localStorage.setItem('userData', JSON.stringify(fixedData));
      }
    }
  } catch (error) {
    console.error('Error fixing user data:', error);
  }
};
