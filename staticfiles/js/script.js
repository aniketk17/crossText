document.addEventListener("DOMContentLoaded", () => {
    let userLocation = null;
    let socket = null;

    function hideLoader() {
        const loadingOverlay = document.getElementById("loadingOverlay");
        if (loadingOverlay) {
            loadingOverlay.style.display = "none";
        }
    }

    function initializeWebSocket() {
        socket = new WebSocket("ws://" + window.location.host + "/ws/share/");

        socket.onopen = function () {
            console.log("WebSocket connection established.");
            const connectionStatus = document.getElementById("connection-status");
            if (connectionStatus) {
                connectionStatus.textContent = "Connected";
                connectionStatus.classList.remove("status-connecting");
                connectionStatus.classList.add("status-connected");
            }
            hideLoader();
        };

        socket.onerror = function (error) {
            console.error("WebSocket error:", error);
            const connectionStatus = document.getElementById("connection-status");
            if (connectionStatus) {
                connectionStatus.textContent = "Disconnected";
                connectionStatus.classList.remove("status-connecting");
                connectionStatus.classList.add("status-disconnected");
            }
            hideLoader();
            alert("Failed to connect to the server. Please try again.");
        };

        socket.onmessage = function (event) {
            const data = JSON.parse(event.data);
            if (data.type === "assign_username") {
                const usernameElement = document.getElementById("username");
                if (usernameElement) {
                    usernameElement.innerText = data.username;
                }
            } else if (data.type === "user_list") {
                updateUserList(data.users);
            } else if (data.type === "received_text") {
                const receivedTextElement = document.getElementById("received-text");
                const senderInfoElement = document.getElementById("sender-info");
                if (receivedTextElement && senderInfoElement) {
                    receivedTextElement.innerText = data.message;
                    senderInfoElement.innerText = `From: ${data.sender}`;
                }
            }
        };
    }

    function getUserLocation(callback) {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    userLocation = { latitude: position.coords.latitude, longitude: position.coords.longitude };
                    const locationStatus = document.getElementById("location-status");
                    if (locationStatus) {
                        locationStatus.textContent = "Detected";
                    }
                    callback(userLocation);
                    if (socket) {
                        socket.send(JSON.stringify({ action: "update_location", ...userLocation }));
                    }
                    hideLoader();
                },
                (error) => {
                    console.error("Error getting location:", error);
                    const locationStatus = document.getElementById("location-status");
                    if (locationStatus) {
                        locationStatus.textContent = "Blocked";
                    }
                    alert("Location access required!");
                    hideLoader();
                }
            );
        } else {
            const locationStatus = document.getElementById("location-status");
            if (locationStatus) {
                locationStatus.textContent = "Unsupported";
            }
            alert("Geolocation not supported!");
            hideLoader();
        }
    }

    function updateUserList(users) {
        const container = document.getElementById("users-container");
        if (!container) {
            console.error("Element with ID 'users-container' not found.");
            return;
        }
        container.innerHTML = "";

        const containerRect = container.getBoundingClientRect();
        users.forEach(user => {
            if (user.username !== document.getElementById("username").innerText && userLocation) {
                const { x, y } = getRandomPosition(containerRect.width, containerRect.height);

                const div = document.createElement("div");
                div.className = "user-box";
                div.style.left = `${x}px`;
                div.style.top = `${y}px`;
                div.textContent = user.username;

                // Directly paste on click
                div.onclick = () => sendClipboardToUser(user.username);

                container.appendChild(div);
            }
        });

        // Update user count
        const userCountElement = document.getElementById("user-count");
        if (userCountElement) {
            userCountElement.textContent = `${users.length} users nearby`;
        }
    }

    function getRandomPosition(containerWidth, containerHeight) {
        const x = Math.random() * (containerWidth - 100);
        const y = Math.random() * (containerHeight - 50);
        return { x, y };
    }

    async function sendClipboardToUser(user) {
        try {
            // Check if the Clipboard API is supported
            if (!navigator.clipboard || !navigator.clipboard.readText) {
                alert("Clipboard API is not supported in this browser.");
                return;
            }

            // Check clipboard permissions
            const permissionStatus = await navigator.permissions.query({ name: "clipboard-read" });
            if (permissionStatus.state === "granted" || permissionStatus.state === "prompt") {
                // Access the clipboard content
                const text = await navigator.clipboard.readText();
                if (!text) {
                    alert("No text found in clipboard!");
                    return;
                }
                // Send the clipboard text to the selected user
                socket.send(JSON.stringify({ action: "send_text", receiver: user, message: text }));
                alert(`Text sent to ${user}`);
            } else {
                alert("Clipboard access denied. Please grant permission to use this feature.");
            }
        } catch (err) {
            console.error("Failed to access clipboard:", err);
            alert("Failed to access clipboard. Please ensure clipboard permissions are granted.");
        }
    }

    function broadcastText() {
        const text = document.getElementById("clipboard").value;
        if (!text) {
            alert("No text to broadcast!");
            return;
        }
        socket.send(JSON.stringify({ action: "broadcast_text", message: text }));
        alert("Text broadcasted to all users.");
    }

    function copyToClipboard() {
        const text = document.getElementById("clipboard").value;
        if (!text) {
            alert("No text to copy!");
            return;
        }
        navigator.clipboard.writeText(text)
            .then(() => alert("Text copied to clipboard!"))
            .catch(() => alert("Failed to copy text to clipboard."));
    }

    function clearText() {
        document.getElementById("clipboard").value = "";
        alert("Clipboard cleared.");
    }

    function initializeApp() {
        initializeWebSocket();
        getUserLocation(() => console.log("User location updated!"));
    }

    initializeApp();
});