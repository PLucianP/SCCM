import json
import qrcode
from datetime import datetime
import os
from django.conf import settings


def generate_qr_code(data, output_dir=None):
    """
    Generate a QR code from JSON data
    """
    if output_dir is None:
        output_dir = settings.QR_CODES_DIR
        # Create the directory if it doesn't exist
        os.makedirs(output_dir, exist_ok=True)

    # Convert data to JSON string
    json_str = json.dumps(data, ensure_ascii=False)

    # Create QR code instance
    qr = qrcode.QRCode(
        version=None,  # Auto-size based on content
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )

    # Add data to QR code
    qr.add_data(json_str)
    qr.make(fit=True)

    # Create an image from the QR Code
    qr_image = qr.make_image(fill_color="black", back_color="white")

    # Generate filename using timestamp and client name
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    client_name = data['client']['name'].replace(' ', '_')
    filename = f"order_{client_name}_{timestamp}.png"
    file_path = os.path.join(output_dir, filename)

    # Save the QR code
    qr_image.save(file_path)
    return os.path.join('qrcodes', filename)  # Return path relative to media folder
