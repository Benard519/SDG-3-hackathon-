// Application constants and configuration

export const APP_NAME = 'CareEase';
export const APP_VERSION = '1.0.0';

// Color system for consistent theming
export const COLORS = {
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8'
  },
  secondary: {
    50: '#ecfdf5',
    100: '#d1fae5',
    500: '#10b981',
    600: '#059669'
  },
  accent: {
    50: '#fff7ed',
    100: '#ffedd5',
    500: '#f97316',
    600: '#ea580c'
  },
  emergency: {
    50: '#fef2f2',
    100: '#fee2e2',
    500: '#ef4444',
    600: '#dc2626'
  },
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    500: '#6b7280',
    600: '#4b5563',
    900: '#111827'
  }
};

// Health metric ranges for visual indicators
export const HEALTH_RANGES = {
  blood_pressure: {
    normal: { systolic: [90, 120], diastolic: [60, 80] },
    elevated: { systolic: [120, 129], diastolic: [60, 80] },
    high: { systolic: [130, 180], diastolic: [80, 120] }
  },
  blood_sugar: {
    normal: [70, 140],
    elevated: [140, 180],
    high: [180, 300]
  },
  temperature: {
    normal: [97.0, 99.5],
    fever: [99.5, 103.0],
    high_fever: [103.0, 110.0]
  }
};

// Caregiver wellness tips
export const CAREGIVER_TIPS = [
  {
    title: "Take Breaks Regularly",
    content: "Remember to take short breaks every 2-3 hours. Even 5 minutes of deep breathing can help reduce stress and maintain your energy levels.",
    category: "self_care"
  },
  {
    title: "Stay Hydrated",
    content: "Keep a water bottle nearby and aim for 8 glasses of water daily. Proper hydration helps maintain focus and energy while caregiving.",
    category: "health"
  },
  {
    title: "Use Active Listening",
    content: "When communicating with elderly patients, maintain eye contact, speak clearly, and give them time to respond. This builds trust and reduces frustration.",
    category: "communication"
  },
  {
    title: "Practice Stress Management",
    content: "Try the 4-7-8 breathing technique: inhale for 4 seconds, hold for 7, exhale for 8. This can help calm your nervous system during stressful moments.",
    category: "stress"
  },
  {
    title: "Maintain Your Own Health",
    content: "Don't skip your own meals or medical appointments. You can't pour from an empty cup - taking care of yourself enables better patient care.",
    category: "self_care"
  },
  {
    title: "Document Everything",
    content: "Keep detailed logs of medications, symptoms, and behaviors. This information is invaluable for doctors and helps track progress over time.",
    category: "health"
  }
];

// Animation variants for consistent motion design
export const ANIMATION_VARIANTS = {
  fadeIn: {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 0.8, 
        ease: "easeOut",
        type: "spring",
        stiffness: 100
      } 
    }
  },
  slideIn: {
    hidden: { opacity: 0, x: -50 },
    visible: { 
      opacity: 1, 
      x: 0, 
      transition: { 
        duration: 0.7, 
        ease: "easeOut",
        type: "spring",
        stiffness: 120
      } 
    }
  },
  scaleIn: {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      transition: { 
        duration: 0.6, 
        ease: "easeOut",
        type: "spring",
        stiffness: 200
      } 
    }
  },
  stagger: {
    visible: {
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1
      }
    }
  },
  float: {
    animate: {
      y: [-5, 5, -5],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  },
  pulse: {
    animate: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  }
};