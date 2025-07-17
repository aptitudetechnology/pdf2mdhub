# PDF2MD Document Management System

A lightweight document management web application with client-side PDF to Markdown conversion using OpenGovSG's pdf2md library.

## Components ####


sudo apt install npm
npm install pdf2md

sudo apt update
sudo apt install poppler-utils
### Prerequisites (Local Development)

Install required system packages:
```bash
sudo apt update
sudo apt install npm poppler-utils
```

Install the pdf2md library for client-side conversion:
```bash
npm install pdf2md
```

These steps are required for local development and testing. For Docker deployment, these dependencies are handled in the container build process.

## Quick Start

### Document Management System
```bash
cd pdf2md-docs/backend
pip install -r requirements.txt
python app.py
```

### Plugin Installation
```bash
cd plugins/pdf2md_plugin
pip install -e .
```

## Architecture

- **Frontend**: Modern web interface with drag-and-drop upload.
- **Backend**: Flask API with document management.
- **Plugin**: Python plugin for middleware integration
- **Processing**: Client-side PDF to Markdown conversion

See individual README files in each component for detailed setup instructions.


# PDF2MD Document Management System

A lightweight document management web application with client-side PDF to Markdown conversion using OpenGovSG's pdf2md library, plus a corresponding plugin for the Business Plugin Middleware integration.

## 🚀 Features

### Document Management
- **Drag-and-drop PDF upload** with real-time progress
- **Client-side PDF to Markdown conversion** (no server processing load)
- **Document storage** with file system or cloud storage options
- **Metadata management** with tags, categories, dates, and notes
- **Document viewer** with side-by-side PDF and Markdown preview
- **Full-text search** across documents and metadata
- **Batch processing** for multiple document conversion

### Plugin Integration
- **Business Plugin Middleware** integration via API
- **Webhook notifications** for real-time status updates
- **Metadata synchronization** between systems
- **Auto-tagging** and document organization



## 📁 Project Structure

```
pdf2md-docs/                  # Document Management System
├── backend/                  # Flask API
│   ├── app.py               # Main application
│   ├── requirements.txt     # Python dependencies
│   ├── models/              # Database models
│   │   ├── __init__.py      # Package initialization
│   │   ├── document.py      # Document model
│   │   └── metadata.py      # Metadata model
│   ├── routes/              # API endpoints
│   │   ├── __init__.py      # Package initialization
│   │   ├── documents.py     # Document CRUD
│   │   ├── search.py        # Search endpoints
│   │   └── upload.py        # Upload handling
│   ├── utils/               # Utilities
│   │   ├── __init__.py      # Package initialization
│   │   ├── storage.py       # File storage
│   │   └── indexing.py      # Search indexing
│   ├── config/              # Configuration
│   │   ├── __init__.py      # Package initialization
│   │   └── settings.py      # App settings
│   └── tests/               # Backend tests
│       ├── __init__.py      # Package initialization
│       └── test_api.py      # API tests
├── frontend/                # Web interface
│   ├── static/              # Static assets
│   │   ├── js/              # JavaScript files
│   │   │   ├── main.js      # Main application JS
│   │   │   ├── pdf2md.js    # PDF conversion
│   │   │   ├── document-viewer.js # Document viewer
│   │   │   ├── search.js    # Search functionality
│   │   │   └── upload.js    # Upload handling
│   │   ├── css/             # Stylesheets
│   │   │   └── styles.css   # Main styles
│   │   ├── images/          # Image assets
│   │   └── lib/             # Third-party libraries
│   │       └── pdf2md.min.js # OpenGovSG pdf2md library
│   └── templates/           # HTML templates
│       ├── base.html        # Base template
│       ├── documents.html   # Document listing
│       ├── search.html      # Search interface
│       ├── upload.html      # Upload interface
│       └── viewer.html      # Document viewer
├── docker/                  # Container configuration
│   ├── Dockerfile          # Docker build file
│   └── docker-compose.yml  # Docker compose config
├── plugins/                 # Plugin directory
│   └── pdf2md_plugin/      # Business Plugin Middleware integration
│       ├── __init__.py     # Package initialization
│       ├── plugin.py       # Main plugin class
│       ├── client.py       # API client
│       ├── config.json     # Plugin configuration
│       ├── requirements.txt # Plugin dependencies
│       ├── setup.py        # Plugin setup
│       ├── README.md       # Plugin documentation
│       └── tests/          # Plugin tests
│           ├── __init__.py # Package initialization
│           ├── test_client.py # Client tests
│           └── test_plugin.py # Plugin tests
├── .env.example            # Environment configuration template
├── .gitignore             # Git ignore file
├── dev-instructions.md    # Development instructions
├── info.sh               # Directory structure info script
├── README.md             # This file
└── setup.py              # Project setup
```


## 🛠️ Quick Start

### 1. Initial Setup

Run the setup script to create the directory structure:

```bash
# Clone or download the setup script
chmod +x setup.sh
./setup.sh
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit configuration
nano .env
```

### 3. Document Management System

```bash
# Navigate to backend
cd pdf2md-docs/backend

# Install dependencies
pip install -r requirements.txt

# Initialize database
python -c "from app import db; db.create_all()"

# Run the application
python app.py
```

The web interface will be available at `http://localhost:5000`

### 4. Plugin Installation

```bash
# Navigate to plugin directory
cd plugins/pdf2md_plugin

# Install plugin
pip install -e .

# Configure plugin in your middleware system
# See plugin documentation for integration details
```

## 📊 Database Schema

### Documents Table
- `id` - Primary key
- `filename` - Stored filename
- `original_name` - Original upload name
- `file_path` - Storage path
- `markdown_content` - Converted markdown
- `file_size` - File size in bytes
- `upload_date` - Upload timestamp
- `processed_date` - Processing completion
- `status` - Processing status
- `notes` - User notes

### Tags & Metadata
- Tags system for document organization
- Flexible metadata key-value storage
- Document-tag relationships

## 🔌 API Endpoints

### Document Management
- `POST /api/documents` - Upload and process document
- `GET /api/documents` - List documents with filters
- `GET /api/documents/{id}` - Get specific document
- `PUT /api/documents/{id}` - Update document metadata
- `DELETE /api/documents/{id}` - Delete document
- `GET /api/documents/{id}/markdown` - Get converted markdown

### Search & Discovery
- `GET /api/search` - Search documents
- `GET /api/tags` - List all tags
- `GET /api/health` - System health check

## 🔧 Configuration

### Environment Variables

```env
# Flask Configuration
FLASK_ENV=development
FLASK_DEBUG=True
SECRET_KEY=your-secret-key-here

# Database
DATABASE_URL=sqlite:///pdf2md.db

# Storage
UPLOAD_FOLDER=uploads/
MAX_CONTENT_LENGTH=16777216  # 16MB

# PDF2MD Configuration
PDF2MD_API_ENDPOINT=http://localhost:5000
PDF2MD_API_KEY=your-api-key-here

# Plugin Configuration
PLUGIN_WEBHOOK_URL=http://localhost:8000/webhook/pdf2md
PLUGIN_TIMEOUT=30
PLUGIN_RETRY_ATTEMPTS=3
```

### Plugin Configuration

```json
{
  "name": "pdf2md_plugin",
  "version": "1.0.0",
  "enabled": true,
  "supported_formats": [".pdf"],
  "document_system": {
    "endpoint": "http://localhost:5000",
    "api_key": "your-api-key",
    "timeout": 30
  },
  "processing": {
    "auto_tag": true,
    "default_tags": ["middleware-upload"],
    "preserve_original": true
  }
}
```

## 🏗️ Development

### Prerequisites
- Python 3.8+
- Flask
- SQLAlchemy
- OpenGovSG pdf2md library
- Modern web browser (for client-side processing)

### Development Setup

```bash
# Install development dependencies
pip install -r requirements-dev.txt

# Run tests
python -m pytest tests/

# Run with debug mode
FLASK_ENV=development python app.py
```

### Client-Side Processing

The system uses OpenGovSG's pdf2md library for client-side PDF conversion:

```javascript
// pdf2md.js - Core conversion logic
class PDF2MDProcessor {
    async convertPDF(file, options = {}) {
        // Convert PDF to Markdown in browser
        // Show progress, handle errors
        // Return markdown content
    }
}
```

## 🐳 Docker Deployment

```bash
# Build container
cd pdf2md-docs/docker
docker build -t pdf2md-docs .

# Run with docker-compose
docker-compose up -d
```

## 🔗 Plugin Integration

### Business Plugin Middleware

The plugin integrates with the Business Plugin Middleware system:

```python
class PDF2MDPlugin(ProcessingPlugin):
    def process_document(self, document_path, metadata=None):
        # Upload PDF to document system
        # Return processing status and document ID
        
    def search_documents(self, query):
        # Search documents via API
```

### Webhook Integration

Configure webhooks for real-time notifications:

```bash
# Set webhook URL in environment
PLUGIN_WEBHOOK_URL=http://your-middleware:8000/webhook/pdf2md
```

## 📈 Performance

### Client-Side Benefits
- **No server load** for PDF processing
- **Real-time feedback** during conversion
- **Scalable processing** that grows with users
- **Faster response times** for document upload

### Optimization
- Efficient file storage and indexing
- Search optimization with full-text indexing
- Responsive UI with progressive loading
- Batch processing for multiple documents

## 🔍 Search Features

- **Full-text search** across document content
- **Metadata search** by tags, dates, filenames
- **Advanced filtering** by file type, size, date ranges
- **Search result highlighting** and pagination
- **Saved searches** and search history

## 🎨 User Interface

### Modern Web Interface
- Responsive design for desktop and mobile
- Drag-and-drop file upload with progress
- Real-time conversion feedback
- Side-by-side PDF and Markdown viewer
- Tag-based organization system
- Advanced search with filters

### Key UI Components
- **Upload Interface** - Modern drag-and-drop with progress
- **Document Grid** - Thumbnail view with metadata
- **Document Viewer** - PDF and Markdown side-by-side
- **Search Interface** - Advanced search with filters
- **Tagging System** - Visual tag management

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the AGPL License - see the LICENSE file for details.

## 🆘 Support

### Documentation
- [API Documentation](docs/api.md)
- [Plugin Development Guide](docs/plugins.md)
- [Deployment Guide](docs/deployment.md)

### Getting Help
- Check the [Issues](https://github.com/yourorg/pdf2md-docs/issues) page
- Review the [FAQ](docs/faq.md)
- Contact the development team

## 🔗 Related Projects

- [OpenGovSG pdf2md](https://github.com/opengovsg/pdf2md) - Client-side PDF to Markdown conversion
- [Business Plugin Middleware](https://github.com/aptitudetechnology/Business-Plugin-Middleware) - Plugin system integration
- [Paperless-NGX](https://github.com/paperless-ngx/paperless-ngx) - Document management inspiration

## 🚀 Roadmap

### Phase 1: Core System ✅
- [x] Flask backend with document API
- [x] Database schema and models
- [x] File storage and upload handling
- [x] Client-side PDF2MD integration
- [x] Basic document viewer interface

### Phase 2: Plugin System ✅
- [x] ProcessingPlugin class structure
- [x] API client for document system
- [x] Configuration management
- [x] Webhook handling for notifications

### Phase 3: Enhanced Features 🚧
- [ ] Advanced search with facets
- [ ] Batch operations
- [ ] Document versioning
- [ ] OCR integration
- [ ] Multi-language support

### Phase 4: Enterprise Features 📋
- [ ] User authentication and authorization
- [ ] Role-based access control
- [ ] Audit logging
- [ ] Backup and restore
- [ ] Advanced analytics

---

**Happy coding! 🚀**

For questions or support, please check the documentation or open an issue.