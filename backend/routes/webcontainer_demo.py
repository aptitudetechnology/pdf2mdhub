# backend/routes/webcontainer_demo.py

from flask import Blueprint, render_template

webcontainer_demo_bp = Blueprint('webcontainer_demo', __name__)

@webcontainer_demo_bp.route('/webcontainer-demo')
def webcontainer_demo():
    # Assumes you have 'webcontainer-demo.html' in frontend/templates/
    return render_template('webcontainer-demo.html')