# crossText 📍📲⇄💻  
*Share text across devices within a 100m radius – like a local-network clipboard!*  

**Key Features**:  
- 🔄 **Real-time sync**: Instantly share text snippets between devices.  
- 📍 **Proximity-based**: Works within ~100m using local network discovery.  
- 🔒 **No cloud**: Data stays local (uses in-memory Redis DB).  
- 🚀 **Lightweight**: Web-based, no installations needed.  
---

## How It Works ⚙️  
1. **Device A** writes text and "shares" it.  
2. **Device B** (within 100m) automatically receives the text via WebSockets.  
3. Both devices see the same clipboard content in real time.  

**Tech Stack**:  
- **Frontend**: HTML/CSS/JS + Bootstrap  
- **Backend**: Django (Python)  
- **Real-time**: WebSockets (`Django Channels`)  
- **Database**: Redis (in-memory cache)  
- **Proximity**: Geolocation API  

--- 

## 🛠 Installation

```bash
# 1. Clone repository
git clone https://github.com/aniketk17/crossText.git
cd crossText

# 2. Set up virtual environment
python -m venv venv
source venv/bin/activate  # Windows: .\venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Start Redis (new terminal)
docker run -p 6379:6379 redis

# 5. Run the server
python manage.py migrate
python manage.py runserver
