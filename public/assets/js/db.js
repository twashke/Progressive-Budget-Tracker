const indexedDB = 
    window.indexedDB ||
    window.mozIndexedDB ||
    window.webkitIndexedDB ||
    window.msIndexedDB ||
    window.shimIndexedDB;

    let db;

    const request = indexedDB.open("budget", 1);

    // Request on upgrade
    request.onupgradeneeded = (event) => {
        event.target.result.createObjectStore("pending", {
            keyPath: "id",
            autoIncrement: true
        });
    };
    // On error console log error message
    request.onerror = (error) => {
        console.log(error.message);
    };

    // When successful
    request.onsuccess = (event) => {
        db = event.target.result;
        // If Online
        if(navigator.onLine) {
            checkDatabase();
        }
    };

    // Function for when a user creates an offline transaction
    function saveRecord(data) {
        const transaction = db.transaction("pending", "readwrite");
        const store = transaction.objectStore("pending");
        store.add(data);
    }

    // Cechk Databasse when user goes online
    function checkDatabase() {
        const transaction = db.transaction("pending", "readonly");
        const store = transaction.objectStore("pending");
        const getAll = store.getAll();
        // If successful POST the data 
        getAll.onsuccess = () => {
            if (getAll.result.length > 0) {
                fetch("/api/transaction/bulk", {
                    method: "POST",
                    body: JSON.stringify(getAll.result),
                    headers: {
                        Accept: "application/json, text/plain, */*",
                        "Content-Type": "application/json"
                    }
                })
                .then((response) => response.json())
                .then(() => {
                    const transaction = db.transaction("pending", "readwrite");
                    const store = transaction.objectStore("pending");
                    // Clear the pending items
                    store.clear();
                });
            }
        };
    }

// EventListener for when back online call checkDatabase function
window.addEventListener("online", checkDatabase);
