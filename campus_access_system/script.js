class SmartCampusSystem {
    constructor() {
        this.isRunning = false;
        this.currentPhase = 1;
        this.personType = 'unknown';
        this.accessGranted = false;
        this.demoInterval = null;
        this.phaseTimeouts = [];
        
        this.initializeEventListeners();
        this.updateTime();
        this.initializeSystem();
    }

    initializeEventListeners() {
        document.getElementById('start-demo').addEventListener('click', () => this.startDemo());
        document.getElementById('reset-demo').addEventListener('click', () => this.resetDemo());
        document.getElementById('simulate-student').addEventListener('click', () => this.simulateStudent());
        document.getElementById('simulate-teacher').addEventListener('click', () => this.simulateTeacher());
        
        setInterval(() => this.updateTime(), 1000);
    }

    updateTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString();
        document.getElementById('current-time').textContent = timeString;
    }

    initializeSystem() {
        this.addLog('🚀 SmartCampus Access System Initialized', 'system');
        this.addLog('💡 Click "Start Demo" to begin the interactive demonstration', 'system');
        this.updateUI();
    }

    startDemo() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.addLog('🎬 Live demo session started', 'system');
        this.addLog('🔍 Phase 1: Scanning for identity straps...', 'system');
        this.updateUI();
        
        this.runDemoSequence();
    }

    resetDemo() {
        this.isRunning = false;
        this.currentPhase = 1;
        this.personType = 'unknown';
        this.accessGranted = false;
        
        // Clear all timeouts
        this.phaseTimeouts.forEach(timeout => clearTimeout(timeout));
        this.phaseTimeouts = [];
        
        if (this.demoInterval) {
            clearInterval(this.demoInterval);
        }
        
        this.addLog('🔄 System reset - Ready for new demonstration', 'system');
        this.updateUI();
        this.resetPhaseUI();
    }

    simulateStudent() {
        if (!this.isRunning) {
            this.showNotification('Please start the demo first!', 'warning');
            return;
        }
        
        if (this.currentPhase !== 1) {
            this.showNotification('Strap detection phase completed!', 'info');
            return;
        }
        
        this.personType = 'student';
        this.addLog('🎓 Student identified - Purple strap detected', 'student');
        this.addLog('✅ Phase 1 completed: Student verification successful', 'success');
        this.advanceToNextPhase();
    }

    simulateTeacher() {
        if (!this.isRunning) {
            this.showNotification('Please start the demo first!', 'warning');
            return;
        }
        
        if (this.currentPhase !== 1) {
            this.showNotification('Strap detection phase completed!', 'info');
            return;
        }
        
        this.personType = 'teacher';
        this.addLog('👨‍🏫 Teacher identified - Blue strap detected', 'teacher');
        this.addLog('✅ Phase 1 completed: Teacher verification successful', 'success');
        this.advanceToNextPhase();
    }

    runDemoSequence() {
        // Reset to phase 1
        this.currentPhase = 1;
        this.updateUI();
        
        this.addLog('🔍 Phase 1: Scanning for identity straps...', 'system');
        this.updatePhaseDisplay('Phase 1: Strap Detection', 'Show purple strap for Student, blue for Teacher');
        
        // Auto-advance demonstration
        this.demoInterval = setInterval(() => {
            if (!this.isRunning) return;
            
            if (this.currentPhase === 1 && this.personType === 'unknown') {
                // Still waiting for strap detection
                this.updateDetectionBox('🔍');
            }
            else if (this.currentPhase === 2) {
                // Phase 2: ID Verification
                this.simulateIDVerification();
            }
            else if (this.currentPhase === 3) {
                // Phase 3: Vehicle Detection
                this.simulateVehicleDetection();
            }
        }, 2000);
    }

    advanceToNextPhase() {
        if (this.currentPhase === 1 && this.personType !== 'unknown') {
            // Move to Phase 2
            this.currentPhase = 2;
            this.addLog(`✅ Phase 1: ${this.personType} identified - Moving to ID verification`, 'success');
            this.updateUI();
            this.simulateIDVerification();
        }
    }

    simulateIDVerification() {
        this.updatePhaseDisplay('Phase 2: ID Verification', 'Face detected - Verifying with database...');
        this.updateDetectionBox('📷');
        
        // Simulate face detection and verification
        const timeout = setTimeout(() => {
            if (this.isRunning && this.currentPhase === 2) {
                this.addLog('✅ ID verified successfully - Face matches database records', 'success');
                this.currentPhase = 3;
                this.updateUI();
                this.simulateVehicleDetection();
            }
        }, 3000);
        
        this.phaseTimeouts.push(timeout);
    }

    simulateVehicleDetection() {
        this.updatePhaseDisplay('Phase 3: Vehicle Detection', 'Scanning for license plate...');
        this.updateDetectionBox('🚗');
        
        // Simulate vehicle detection
        const timeout1 = setTimeout(() => {
            if (this.isRunning && this.currentPhase === 3) {
                const vehicleNumber = this.personType === 'student' ? 'STU001' : 'TCH001';
                this.addLog(`✅ Vehicle detected: ${vehicleNumber} - Checking authorization...`, 'success');
                
                const timeout2 = setTimeout(() => {
                    if (this.isRunning) {
                        this.accessGranted = true;
                        this.addLog(`🎉 ACCESS GRANTED: ${this.personType} with vehicle ${vehicleNumber}`, 'success');
                        this.updateUI();
                        this.showAccessGranted();
                        this.showSuccessModal();
                    }
                }, 2000);
                
                this.phaseTimeouts.push(timeout2);
            }
        }, 3000);
        
        this.phaseTimeouts.push(timeout1);
    }

    updatePhaseDisplay(phaseText, statusText) {
        const phaseIndicator = document.getElementById('phase-indicator');
        phaseIndicator.innerHTML = `
            <span class="phase-badge">Phase ${this.currentPhase}</span>
            <span class="phase-text">${phaseText}</span>
        `;
        
        // Update status overlay in camera feed
        const statusElements = document.querySelectorAll('.status-overlay');
        statusElements.forEach(element => {
            element.textContent = statusText;
        });
    }

    updateDetectionBox(emoji) {
        const detectionBox = document.querySelector('.detection-box');
        if (detectionBox) {
            detectionBox.textContent = emoji;
            detectionBox.style.borderColor = '#fff';
            detectionBox.style.animation = 'pulse 2s infinite';
        }
    }

    showAccessGranted() {
        const detectionBox = document.querySelector('.detection-box');
        if (detectionBox) {
            detectionBox.textContent = '✅';
            detectionBox.style.borderColor = '#10b981';
            detectionBox.style.background = 'rgba(16, 185, 129, 0.2)';
            detectionBox.classList.add('success-glow');
        }
        
        this.updatePhaseDisplay('ACCESS GRANTED!', 'Welcome to Campus! 🎉');
    }

    showSuccessModal() {
        const modal = document.getElementById('success-modal');
        if (modal) {
            modal.style.display = 'block';
        }
    }

    showNotification(message, type = 'info') {
        // Create a temporary notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            background: ${type === 'warning' ? '#f59e0b' : '#6366f1'};
            color: white;
            border-radius: 10px;
            z-index: 3000;
            font-weight: 600;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    updateUI() {
        // Update phase display
        const phaseText = this.getPhaseText();
        document.getElementById('current-phase').textContent = phaseText;
        
        // Update person type
        const personTypeElement = document.getElementById('person-type');
        personTypeElement.textContent = this.personType.charAt(0).toUpperCase() + this.personType.slice(1);
        
        // Update access status
        const accessStatus = document.getElementById('access-status');
        if (this.accessGranted) {
            accessStatus.textContent = 'ACCESS GRANTED 🎉';
            accessStatus.className = 'status-value access-status';
            accessStatus.style.background = '#10b981';
        } else {
            accessStatus.textContent = this.currentPhase === 1 ? 'Waiting for strap...' : 'Processing...';
            accessStatus.className = 'status-value access-status';
            accessStatus.style.background = '#f59e0b';
        }
        
        // Update phase progress
        this.updatePhaseProgress();
        
        // Update demo controls
        this.updateDemoControls();
    }

    getPhaseText() {
        switch(this.currentPhase) {
            case 1: return '1 - Strap Detection';
            case 2: return '2 - ID Verification';
            case 3: return '3 - Vehicle Detection';
            default: return '1 - Strap Detection';
        }
    }

    updatePhaseProgress() {
        // Reset all steps
        document.getElementById('step-1').classList.remove('active', 'completed');
        document.getElementById('step-2').classList.remove('active', 'completed');
        document.getElementById('step-3').classList.remove('active', 'completed');
        
        // Update step 1
        const step1 = document.getElementById('step-1');
        const step1Status = document.getElementById('step1-status');
        
        if (this.currentPhase >= 1) {
            if (this.currentPhase > 1) {
                step1.classList.add('completed');
                step1Status.innerHTML = '<i class="fas fa-check"></i> Completed';
            } else {
                step1.classList.add('active');
                step1Status.innerHTML = this.personType !== 'unknown' ? 
                    '<i class="fas fa-check"></i> Identified' : 
                    '<i class="fas fa-search"></i> Scanning...';
            }
        }
        
        // Update step 2
        const step2 = document.getElementById('step-2');
        const step2Status = document.getElementById('step2-status');
        
        if (this.currentPhase >= 2) {
            if (this.currentPhase > 2) {
                step2.classList.add('completed');
                step2Status.innerHTML = '<i class="fas fa-check"></i> Verified';
            } else {
                step2.classList.add('active');
                step2Status.innerHTML = '<i class="fas fa-camera"></i> Verifying...';
            }
        }
        
        // Update step 3
        const step3 = document.getElementById('step-3');
        const step3Status = document.getElementById('step3-status');
        
        if (this.currentPhase >= 3) {
            step3.classList.add('active');
            if (this.accessGranted) {
                step3Status.innerHTML = '<i class="fas fa-check"></i> Access Granted';
                step3.classList.add('completed');
            } else {
                step3Status.innerHTML = '<i class="fas fa-car"></i> Scanning vehicle...';
            }
        }
    }

    resetPhaseUI() {
        this.updatePhaseDisplay('Phase 1: Strap Detection', 'Show purple strap for Student, blue for Teacher');
        
        const detectionBox = document.querySelector('.detection-box');
        if (detectionBox) {
            detectionBox.textContent = '';
            detectionBox.style.borderColor = '#fff';
            detectionBox.style.background = 'transparent';
            detectionBox.classList.remove('success-glow');
            detectionBox.style.animation = 'none';
        }
        
        // Reset phase progress
        document.getElementById('step-1').classList.remove('active', 'completed');
        document.getElementById('step-2').classList.remove('active', 'completed');
        document.getElementById('step-3').classList.remove('active', 'completed');
        document.getElementById('step-1').classList.add('active');
        
        document.getElementById('step1-status').innerHTML = '<i class="fas fa-search"></i> Scanning...';
        document.getElementById('step2-status').innerHTML = '<i class="fas fa-clock"></i> Waiting';
        document.getElementById('step3-status').innerHTML = '<i class="fas fa-clock"></i> Waiting';
    }

    updateDemoControls() {
        const startBtn = document.getElementById('start-demo');
        const resetBtn = document.getElementById('reset-demo');
        const studentBtn = document.getElementById('simulate-student');
        const teacherBtn = document.getElementById('simulate-teacher');
        
        if (this.isRunning) {
            startBtn.disabled = true;
            startBtn.style.opacity = '0.6';
            resetBtn.disabled = false;
            resetBtn.style.opacity = '1';
            
            // Only enable student/teacher buttons in phase 1
            if (this.currentPhase === 1) {
                studentBtn.disabled = false;
                teacherBtn.disabled = false;
                studentBtn.style.opacity = '1';
                teacherBtn.style.opacity = '1';
            } else {
                studentBtn.disabled = true;
                teacherBtn.disabled = true;
                studentBtn.style.opacity = '0.6';
                teacherBtn.style.opacity = '0.6';
            }
        } else {
            startBtn.disabled = false;
            startBtn.style.opacity = '1';
            resetBtn.disabled = true;
            resetBtn.style.opacity = '0.6';
            studentBtn.disabled = true;
            teacherBtn.disabled = true;
            studentBtn.style.opacity = '0.6';
            teacherBtn.style.opacity = '0.6';
        }
    }

    addLog(message, type = 'system') {
        const logsContainer = document.getElementById('logs-container');
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${type}`;
        
        const timestamp = new Date().toLocaleTimeString();
        logEntry.innerHTML = `
            <span class="timestamp">${timestamp}</span>
            <span class="message">${message}</span>
        `;
        
        logsContainer.prepend(logEntry);
        
        // Keep only last 10 logs
        const logs = logsContainer.querySelectorAll('.log-entry');
        if (logs.length > 10) {
            logs[logs.length - 1].remove();
        }
        
        // Auto-scroll to top
        logsContainer.scrollTop = 0;
    }
}

// Global function to close modal
function closeModal() {
    const modal = document.getElementById('success-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Add slideIn animation to CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);

// Initialize the system when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.campusSystem = new SmartCampusSystem();
    console.log('🎓 SmartCampus Access System Loaded!');
    console.log('💡 Click "Start Demo" to begin the interactive demonstration');
});