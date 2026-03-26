const axiosOriginal = require('axios');
console.log("Original Keys:", Object.keys(axiosOriginal));
if (axiosOriginal.default) {
    console.log("Default Keys:", Object.keys(axiosOriginal.default));
} else {
    console.log("No .default found");
}
