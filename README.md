# 🎓 SmartCampus Access System

An **AI-powered campus access prototype** built for **HackNova 2025**.  
This project demonstrates a **multi-step verification workflow** using **Teachable Machine models**, TensorFlow.js, and webcam input in the browser.

---

## 🚀 Features

- **Two-step scanning workflow**
  1. **Face Scan** → detects the person from a trained Teachable Machine model.
  2. **ID Scan** → detects the ID photo and compares against the face.
  3. **Verification** → grants access only if both match.

- **Solo Scanner Modes**  
  Test the **Face scanner** or **ID scanner** individually.

- **Locking Mechanism**
  - Scanner locks when top class ≥ **98% confidence for 1s** continuously.
  - Once locked:
    - Webcam stops.
    - Overlay freezes with ✅ Locked message.
    - "Scan Again" button appears.

- **Interactive Demo Flow**
  - Step progress badges (Pending → Active → Done).
  - Verification result screen: ✅ **Verified** with person’s name, or rescan if mismatch.

- **Modern UI**
  - Glassmorphism style with cards, tiles, and animations.
  - Responsive design.

---

## 🗂 Project Structure

