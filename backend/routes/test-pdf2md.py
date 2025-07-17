from flask import Blueprint, render_template

test_pdf2md_bp = Blueprint('test_pdf2md', __name__)

@test_pdf2md_bp.route('/test-pdf2md')
def test_pdf2md():
    # Assumes you have 'test-pdf2md.html' in frontend/templates/
    return render_template('test-pdf2md.html')