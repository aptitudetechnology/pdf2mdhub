# Create the app instance
app = create_app()

if __name__ == '__main__':
    # Debugging: Print BASE_DIR to confirm it's correct
    #logger.info(f"DEBUG: BASE_DIR is set to: {BASE_DIR}")
    logger.info(f"DEBUG: PROJECT_ROOT is set to: {PROJECT_ROOT}")

    # Define paths to your SSL certificates
    CERT_PATH = os.path.join(PROJECT_ROOT, 'ssl', 'cert.pem')
    KEY_PATH = os.path.join(PROJECT_ROOT, 'ssl', 'key.pem')
    
    # Debugging: Print full paths being checked
    logger.info(f"DEBUG: Checking for CERT_PATH: {CERT_PATH}")
    logger.info(f"DEBUG: Checking for KEY_PATH: {KEY_PATH}")

    # **ADD THESE TWO LINES HERE**
    logger.info(f"DEBUG: Does CERT_PATH exist? {os.path.exists(CERT_PATH)}")
    logger.info(f"DEBUG: Does KEY_PATH exist? {os.path.exists(KEY_PATH)}")
    # **END OF LINES TO ADD**

    # Check if certificate files exist
    if not os.path.exists(CERT_PATH) or not os.path.exists(KEY_PATH):
        logger.warning("SSL certificates (cert.pem, key.pem) not found. Running in HTTP mode.")
        logger.warning("To enable HTTPS, generate them using: openssl genrsa -out key.pem 2048 && openssl req -new -x509 -key key.pem -out cert.pem -days 365")
        app.run(host='0.0.0.0', port=5050, debug=True)
    else:
        logger.info("SSL certificates found. Running in HTTPS mode.")
        app.run(host='0.0.0.0', port=5050, debug=True, ssl_context=(CERT_PATH, KEY_PATH))