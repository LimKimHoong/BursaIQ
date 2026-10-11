"""Generate the QR for the confirmed public BursaIQ demo URL."""
from pathlib import Path
import qrcode

URL = "https://bursaiq-interactive-demo.wellwhale64.chatgpt.site"
qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, box_size=10, border=4)
qr.add_data(URL)
qr.make(fit=True)
target = Path(__file__).with_name("bursaiq-demo-qr.png")
qr.make_image(fill_color="black", back_color="white").save(target)
print(target)
