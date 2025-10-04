import cv2
import easyocr
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle

# Initialize EasyOCR reader
reader = easyocr.Reader(['en'], gpu=False)

# List of authorized number plates
AUTHORIZED_PLATES = [
    'MH01AB1234',
    'DL02CD5678',
    'KA03EF9012',
    'TN04GH3456'
]

# Display mode: 'cv2' or 'matplotlib'
DISPLAY_MODE = 'matplotlib'  # Change to 'cv2' if opencv works

def detect_plate(img):
    """Detect number plate in the image using Haar Cascade"""
    # Load Haar Cascade classifier
    plate_cascade = cv2.CascadeClassifier('haarcascade_russian_plate_number.xml')
    
    if plate_cascade.empty():
        print("Error: Could not load haarcascade file. Make sure it's in the same folder.")
        return []
    
    # Convert to grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # Detect plates
    plates = plate_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
    
    return plates

def preprocess_plate(plate_img):
    """Preprocess the plate image for better OCR results"""
    # Convert to grayscale
    gray = cv2.cvtColor(plate_img, cv2.COLOR_BGR2GRAY)
    
    # Apply bilateral filter to reduce noise while keeping edges sharp
    filtered = cv2.bilateralFilter(gray, 11, 17, 17)
    
    # Apply adaptive thresholding
    thresh = cv2.adaptiveThreshold(filtered, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
                                    cv2.THRESH_BINARY, 11, 2)
    
    return thresh

def extract_text(plate_img):
    """Extract text from plate image using EasyOCR"""
    try:
        # Preprocess the image
        processed = preprocess_plate(plate_img)
        
        # Use EasyOCR to read text
        results = reader.readtext(processed, detail=0)
        
        # Join all detected text
        plate_text = ''.join(results).replace(' ', '').upper()
        
        return plate_text
    except Exception as e:
        print(f"OCR Error: {e}")
        return ""

def check_authorization(plate_text):
    """Check if the plate is authorized"""
    # Remove special characters and spaces
    clean_plate = ''.join(e for e in plate_text if e.isalnum()).upper()
    
    for auth_plate in AUTHORIZED_PLATES:
        if auth_plate in clean_plate or clean_plate in auth_plate:
            return True
    return False

def main():
    # Choose input source: 0 for webcam, or provide video/image path
    source = 0  # Change to 'video.mp4' or 'image.jpg' as needed
    
    # Check if source is an image
    if isinstance(source, str) and source.lower().endswith(('.jpg', '.jpeg', '.png', '.bmp')):
        process_image(source)
    else:
        process_video(source)

def process_image(image_path):
    """Process a single image"""
    img = cv2.imread(image_path)
    
    if img is None:
        print(f"Error: Could not load image from {image_path}")
        return
    
    # Detect plates
    plates = detect_plate(img)
    
    print(f"Detected {len(plates)} plate(s)")
    
    # Create a copy for drawing
    result_img = img.copy()
    
    for (x, y, w, h) in plates:
        # Extract plate region
        plate_img = img[y:y+h, x:x+w]
        
        # Extract text from plate
        plate_text = extract_text(plate_img)
        print(f"Detected Plate: {plate_text}")
        
        # Check authorization
        is_authorized = check_authorization(plate_text)
        
        # Draw rectangle and label
        color = (0, 255, 0) if is_authorized else (0, 0, 255)
        label = "AUTHORIZED" if is_authorized else "UNAUTHORIZED"
        
        cv2.rectangle(result_img, (x, y), (x+w, y+h), color, 3)
        cv2.putText(result_img, f"{label}: {plate_text}", (x, y-10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)
    
    # Display result using matplotlib
    display_with_matplotlib(result_img, 'Number Plate Detection')

def display_with_matplotlib(img, title='Image'):
    """Display image using matplotlib (Windows compatible)"""
    # Convert BGR to RGB for matplotlib
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    
    plt.figure(figsize=(12, 8))
    plt.imshow(img_rgb)
    plt.title(title, fontsize=16)
    plt.axis('off')
    plt.tight_layout()
    plt.show()

def process_video(source):
    """Process video stream or webcam"""
    cap = cv2.VideoCapture(source)
    
    if not cap.isOpened():
        print("Error: Could not open video source")
        print("Try changing source to 1 or 2 if using webcam")
        return
    
    print("Processing video...")
    print("Press 'q' to quit, 's' to save current frame")
    
    # Set up matplotlib for real-time display if using matplotlib mode
    if DISPLAY_MODE == 'matplotlib':
        plt.ion()
        fig, ax = plt.subplots(figsize=(12, 8))
        
    frame_count = 0
    skip_frames = 5  # Process every 5th frame for better performance
    
    try:
        while True:
            ret, frame = cap.read()
            
            if not ret:
                print("End of video or cannot read frame")
                break
            
            frame_count += 1
            
            # Skip frames for better performance
            if frame_count % skip_frames != 0:
                continue
            
            # Detect plates
            plates = detect_plate(frame)
            
            for (x, y, w, h) in plates:
                # Extract plate region
                plate_img = frame[y:y+h, x:x+w]
                
                # Extract text from plate
                plate_text = extract_text(plate_img)
                
                if plate_text:
                    print(f"Frame {frame_count}: Detected - {plate_text}")
                
                # Check authorization
                is_authorized = check_authorization(plate_text)
                
                # Draw rectangle and label
                color = (0, 255, 0) if is_authorized else (0, 0, 255)
                label = "AUTHORIZED" if is_authorized else "UNAUTHORIZED"
                
                cv2.rectangle(frame, (x, y), (x+w, y+h), color, 3)
                cv2.putText(frame, f"{label}: {plate_text}", (x, y-10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)
            
            # Display frame
            if DISPLAY_MODE == 'matplotlib':
                # Convert BGR to RGB
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                ax.clear()
                ax.imshow(frame_rgb)
                ax.axis('off')
                ax.set_title(f'Number Plate Detection - Frame {frame_count}')
                plt.pause(0.001)
                
                # Check for matplotlib window close
                if not plt.fignum_exists(fig.number):
                    break
            else:
                cv2.imshow('Number Plate Detection', frame)
                key = cv2.waitKey(1) & 0xFF
                
                if key == ord('q'):
                    break
                elif key == ord('s'):
                    cv2.imwrite(f'captured_frame_{frame_count}.jpg', frame)
                    print(f"Saved frame {frame_count}")
    
    except KeyboardInterrupt:
        print("\nStopped by user")
    
    finally:
        cap.release()
        if DISPLAY_MODE == 'cv2':
            cv2.destroyAllWindows()
        elif DISPLAY_MODE == 'matplotlib':
            plt.ioff()
            plt.close('all')

if __name__ == "__main__":
    print("Number Plate Detection System")
    print("=" * 50)
    print(f"Display Mode: {DISPLAY_MODE}")
    print(f"Authorized Plates: {len(AUTHORIZED_PLATES)}")
    print("=" * 50)
    main()