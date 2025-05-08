const bcrypt = require('bcrypt'); // Import the bcrypt library

async function hashPassword(password) {
  try {
    const hashedPassword = await bcrypt.hash(password, 10); // 10 is the "salt rounds" - higher is safer but slower
    console.log("Hashed password:", hashedPassword); // Display the hash in the console
    return hashedPassword;
  } catch (error) {
    console.error("Error hashing password:", error);
    throw error; // Propagate the error
  }
}

//  *** Execute the function to get the hash  ***
hashPassword("Ivan04182025!")  // Replace "Ivan04182025!" with the actual password if it's different
  .then(hashed => {
    //  This code runs *after* the password has been hashed.
    //  The 'hashed' variable now holds the bcrypt hash.
    //  *** YOU NEED TO COPY THIS HASHED PASSWORD  ***
    console.log("Ready to copy this hash:", hashed); 
  })
  .catch(err => {
    //  This code runs if there was an error during hashing.
    console.error("Password hashing failed:", err);
  });