import subprocess
import os
import logging
import requests

# Configure basic logging for the script
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def download_test_pdf(url, destination_path):
    """Downloads a PDF file from a given URL to a specified path."""
    logger.info(f"Attempting to download test PDF from: {url}")
    try:
        response = requests.get(url, stream=True)
        response.raise_for_status()  # Raise an HTTPError for bad responses (4xx or 5xx)

        with open(destination_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        logger.info(f"Successfully downloaded test PDF to: {destination_path}")
        return True
    except requests.exceptions.RequestException as e:
        logger.error(f"Error downloading test PDF from {url}: {e}")
        return False
    except Exception as e:
        logger.error(f"An unexpected error occurred during download: {e}", exc_info=True)
        return False

def test_pdf2md_command(pdf_filename="test_invoice.pdf"):
    """
    Tests the pdf2md command line tool.
    Assumes a 'uploads' folder exists in the same directory as this script.
    If the specified PDF file is not found, it downloads a default test PDF.
    """
    logger.info(f"--- Starting test for pdf2md with {pdf_filename} ---")

    # Define paths relative to the script's location
    BASE_DIR = os.path.abspath(os.path.dirname(__file__))
    UPLOADS_DIR = os.path.join(BASE_DIR, 'uploads')

    # Ensure the 'uploads' directory exists
    if not os.path.exists(UPLOADS_DIR):
        os.makedirs(UPLOADS_DIR)
        logger.info(f"Created uploads directory: {UPLOADS_DIR}")

    pdf_path = os.path.join(UPLOADS_DIR, pdf_filename)
    
    # Extract base name for pdf2md's projectname argument (e.g., 'test_invoice')
    base_name = os.path.splitext(os.path.basename(pdf_path))[0]
    
    # Expected output Markdown file path
    output_md_path = os.path.join(UPLOADS_DIR, f"{base_name}.md")

    # Clean up previous test output if it exists
    if os.path.exists(output_md_path):
        os.remove(output_md_path)
        logger.info(f"Cleaned up existing output: {output_md_path}")

    if not os.path.exists(pdf_path):
        logger.warning(f"Test PDF not found at: {pdf_path}")
        default_pdf_url = "https://www.melbpc.org.au/wp-content/uploads/2017/10/small-example-pdf-file.pdf"
        default_pdf_filename = "small-example-pdf-file.pdf"
        default_pdf_path = os.path.join(UPLOADS_DIR, default_pdf_filename)
        
        logger.info(f"Downloading a test PDF: {default_pdf_filename}")
        if download_test_pdf(default_pdf_url, default_pdf_path):
            pdf_path = default_pdf_path
            pdf_filename = default_pdf_filename
            base_name = os.path.splitext(os.path.basename(pdf_path))[0]
            output_md_path = os.path.join(UPLOADS_DIR, f"{base_name}.md")
            logger.info(f"Using downloaded PDF for conversion: {pdf_path}")
        else:
            logger.error("Failed to download a test PDF. Cannot proceed with conversion test.")
            return False

    logger.info(f"Attempting to convert PDF: {pdf_path}")
    logger.info(f"Expected output Markdown: {output_md_path}")

    # The command as determined from previous logs: pdf2md <file.pdf> <projectname>
    command = ['pdf2md', pdf_path, base_name]

    logger.info(f"Executing command: {' '.join(command)}")

    try:
        # Run the pdf2md command
        result = subprocess.run(command, capture_output=True, text=True, check=True)
        
        logger.info(f"pdf2md stdout: {result.stdout.strip()}")
        if result.stderr:
            logger.warning(f"pdf2md stderr: {result.stderr.strip()}")

        # Verify if the markdown file was created
        if os.path.exists(output_md_path):
            logger.info(f"SUCCESS: Markdown file created at: {output_md_path}")
            # Optionally, read and print a bit of content
            try:
                with open(output_md_path, 'r', encoding='utf-8') as f:
                    content = f.read(200) # Read first 200 characters
                    logger.info(f"First 200 chars of Markdown content:\n---\n{content}\n---")
            except Exception as e:
                logger.error(f"Could not read generated Markdown file: {e}")
            return True
        else:
            logger.error(f"FAILURE: Markdown file NOT found after conversion: {output_md_path}")
            logger.error("pdf2md might have run but failed to create the file at the expected location.")
            return False

    except FileNotFoundError:
        logger.error("FAILURE: 'pdf2md' command not found.")
        logger.error("Please ensure 'pdf2md' is installed and its executable is in your system's PATH.")
        return False
    except subprocess.CalledProcessError as e:
        logger.error(f"FAILURE: 'pdf2md' command exited with an error (non-zero status code).")
        logger.error(f"Command: {' '.join(e.cmd)}")
        logger.error(f"Stdout: {e.stdout.strip()}")
        logger.error(f"Stderr: {e.stderr.strip()}")
        return False
    except Exception as e:
        logger.error(f"FAILURE: An unexpected error occurred during pdf2md execution: {e}", exc_info=True)
        return False
    finally:
        logger.info("--- Finished pdf2md test ---")

if __name__ == "__main__":
    # You can change 'test_invoice.pdf' to the actual name of your test PDF
    # in the 'backend/uploads/' folder if it's different.
    # If "Invoice_.pdf" is not found, "small-example-pdf-file.pdf" will be downloaded and used.
    test_pdf2md_command("Invoice_.pdf")