const axios = require('axios');

const payload = {
    type: 'sale',
    propertyType: "apartment",
    city: "Riyadh",
    neighborhood: "Olaya",
    streetName: "King Fahd",
    planNumber: "123",
    plotNumber: "456",
    area: 120,
    deedNumber: "789",
    propertyAge: 5,
    numberOfFloors: 1,
    numberOfUnits: 1,
    specifications: "None",
    totalAmount: 1000000,
    commissionPercentage: 2.5,
    owner: {
        name: "Ali",
        idNumber: "1234567890",
        partyType: "owner",
        agencyNumber: "",
        propertyType: "",
        agreedPercentage: 0
    },
    buyer: {
        name: "Omar",
        idNumber: "0987654321",
        partyType: "buyer",
        agencyNumber: "",
        agreedPercentage: 0
    },
    brokers: [],
    notes: "Test"
};

axios.post('http://localhost:3030/api/commissions', payload, {
    // maybe need auth?
    headers: { 'Content-Type': 'application/json' }
}).then(res => console.log("Success", res.data)).catch(err => {
    if(err.response) {
        console.error("Error data:", JSON.stringify(err.response.data, null, 2));
    } else {
        console.error("Error", err.message);
    }
});
