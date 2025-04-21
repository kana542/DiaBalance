// nopee dev koodi

const LOG_LEVELS = {
   ERROR: 0,
   WARN: 1,
   INFO: 2,
   DEBUG: 3
 };

 const CURRENT_LOG_LEVEL = process.env.NODE_ENV === 'production'
   ? LOG_LEVELS.INFO
   : LOG_LEVELS.DEBUG;

 const logger = {
   error: (message, error) => {
     if (CURRENT_LOG_LEVEL >= LOG_LEVELS.ERROR) {
       console.error(`[ERROR] ${message}`, error ? error.message || error : '');
     }
   },

   warn: (message) => {
     if (CURRENT_LOG_LEVEL >= LOG_LEVELS.WARN) {
       console.warn(`[WARN] ${message}`);
     }
   },

   info: (message) => {
     if (CURRENT_LOG_LEVEL >= LOG_LEVELS.INFO) {
       console.log(`[INFO] ${message}`);
     }
   },

   debug: (message, data) => {
     if (CURRENT_LOG_LEVEL >= LOG_LEVELS.DEBUG) {
       console.log(`[DEBUG] ${message}`);
       if (data && CURRENT_LOG_LEVEL >= LOG_LEVELS.DEBUG) {
         console.log(typeof data === 'object' ? cleanSensitiveData(data) : data);
       }
     }
   }
 };

 function cleanSensitiveData(obj) {
   if (!obj) return obj;

   const sensitiveFields = ['token', 'password', 'salasana', 'authorization', 'idToken', 'kubiosIdToken'];
   const cleanedObj = {...obj};

   sensitiveFields.forEach(field => {
     if (field in cleanedObj) {
       cleanedObj[field] = '***REDACTED***';
     }
   });

   return cleanedObj;
 }

 export default logger;
