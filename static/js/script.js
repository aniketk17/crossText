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
        const wsUrl = "ws://" + window.location.host + "/ws/share/";
        console.log("Connecting to WebSocket at:", wsUrl);

        socket = new WebSocket(wsUrl);

        socket.onopen = function () {
            console.log("WebSocket connection established.");
            updateConnectionStatus("Connected", "status-connected");
            hideLoader();
        };

        socket.onerror = function (error) {
            console.error("WebSocket error:", error);
            updateConnectionStatus("Disconnected", "status-disconnected");
            alert("Failed to connect to the server. Please try again.");
        };

        socket.onclose = function (event) {
            console.log("WebSocket connection closed:", event);
            updateConnectionStatus("Disconnected", "status-disconnected");
            alert("WebSocket connection closed. Please refresh the page.");
        };

        socket.onmessage = function (event) {
            console.log("WebSocket message received:", event.data);
            const data = JSON.parse(event.data);

            if (data.type === "assign_username") {
                document.getElementById("username").innerText = data.username;
            } else if (data.type === "user_list") {
                updateUserList(data.users);
            } else if (data.type === "received_text") {
                displayReceivedText(data.sender, data.message);
            }
            else if (data.type === "text_message") {
                displayReceivedText(data.sender, data.message);
            }
            else if(data.type === "broadcast") {
                displayReceivedText(data.sender, data.message);
            }
        };
    }

    function updateConnectionStatus(text, className) {
        const connectionStatus = document.getElementById("connection-status");
        if (connectionStatus) {
            connectionStatus.textContent = text;
            connectionStatus.className = className;
        }
    }

    function getUserLocation(callback) {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    userLocation = { latitude: position.coords.latitude, longitude: position.coords.longitude };
                    document.getElementById("location-status").textContent = "Detected";
                    callback(userLocation);
                    if (socket) {
                        socket.send(JSON.stringify({ action: "update_location", ...userLocation }));
                    }
                    hideLoader();
                },
                (error) => {
                    console.error("Error getting location:", error);
                    document.getElementById("location-status").textContent = "Blocked";
                    alert("Location access required!");
                    hideLoader();
                }
            );
        } else {
            document.getElementById("location-status").textContent = "Unsupported";
            alert("Geolocation not supported!");
            hideLoader();
        }
    }

    function updateUserList(users) {
        const container = document.getElementById("users-container");
        container.innerHTML = "";
        users.forEach(user => {
            if (user.username !== document.getElementById("username").innerText && userLocation) {
                const div = document.createElement("div");
                div.className = "user-box";
                div.textContent = user.username;
                div.onclick = () => sendClipboardToUser(user.username);
    
                div.style.position = "absolute";
                div.style.top = `${Math.random() * 80}%`;
                div.style.left = `${Math.random() * 80}%`;
    
                container.appendChild(div);
            }
        });
        document.getElementById("user-count").textContent = `${users.length} users nearby`;
    }

    function sendClipboardToUser(user) {
        const text = document.getElementById("clipboard").value;
        if (!text) {
            alert("No text to send!");
            return;
        }
        socket.send(JSON.stringify({ action: "send_text", recipient: user, message: text }));
        alert(`Text sent to ${user}.`);
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
        navigator.clipboard.writeText(text).then(() => alert("Text copied to clipboard!"));
    }

    function clearText() {
        document.getElementById("clipboard").value = "";
        alert("Clipboard cleared.");
    }

    function displayReceivedText(sender, message) {
        document.getElementById("received-text").innerText = message;
        document.getElementById("sender-info").innerText = `From: ${sender}`;
    }

    document.getElementById("broadcast-button").addEventListener("click", broadcastText);
    document.getElementById("copy-button").addEventListener("click", copyToClipboard);
    document.getElementById("clear-button").addEventListener("click", clearText);

    initializeWebSocket();
    getUserLocation(() => console.log("User location updated!"));
});