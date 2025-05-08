const bcrypt = require('bcrypt');

async function hashPassword(password) {
    try {
        const hashedPassword = await bcrypt.hash(password, 10); 
        console.log("Hashed password:", hashedPassword); 
        return hashedPassword;
    } catch (error) {
        console.error("Error hashing password:", error);
        throw error;
    }
}

hashPassword("Ivan04182025!") 
    .then(hashed => {
       
        console.log("Ready to copy this hash:", hashed);
    })
    .catch(err => {
        console.error("Hashing failed:", err);
    });