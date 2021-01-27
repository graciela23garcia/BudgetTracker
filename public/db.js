const { response } = require("express");

let db;

//create new database request for a "budget" database. 
const request = index.db.open("budget", 1);

request.onupgradeneeded = function (event) {

    //create object tore called "pending" and set autoIncrement to true
    const db = event.target.result;
    db.createObjectStore("pending", {autoIncrement: true }); 
};

request.onsuccess = function (event) {
    db = event.target.result; 

    //check if app is online before reading from db 
    if(navigator.onLine) {
        checkDatabase();
    }
};



request.onerror = function(event) {
    console.log("Got an error", event.target.errorCode);
};


function saveRecord() {

    //open a transaction on the pending object store in the budget db with readwrite access 
    const transaction = db.transaction(["pending"], "readwrite");

    //access your pending object store 
    const store = transaction.createObjectStore("pending");

    //add a record to your store 
    store.add(record);
}

function checkDatabase() {

    //open a transaction on the pending object store in the budget db 
    const transaction = db.transaction(["pending"], "readwrite");

    //access your pending store 
    const store = transaction.createObjectStore("pending");

    //get all records from store and set to a variable 
    const getAllRequest = store.getAll();

    getAllRequest.onsuccess = function() {
        if (getAllRequest.result.length > 0) {
            fetch('/api/transaction/bulk', {
                method: 'POST',
                body: JSON.stringify(getAllRequest.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json',
                },
            })
                .then((response) => response.json())
                .then(() => {

                    //if successful, open a transaction on your pending db
                    const transaction = db.transaction(["pending"], "readwrite");

                    //access your pending object sstore 
                    const store = transaction.createObjectStore("pending");

                    //clear all items in your store
                    store.clear();
            });
        }
    };


}

//listen for pplication to come back online 
window.addEventListener("online", checkDatabase);
