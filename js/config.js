// Configuration
const CONFIG = {
    API_URL: 'https://oau-exam-api.onrender.com/api',
    APP_NAME: 'OAU Exam Cbt Practice',
    VERSION: '1.0.0'
};

const FACULTIES = [
    'Agriculture', 'Arts', 'Law', 'Science', 'Social Sciences', 
    'Education', 'Pharmacy', 'Technology', 'Administration',
    'Environmental Design and Management', 'Basic Medical Sciences',
    'Clinical Sciences', 'Dentistry', 'Computing'
];

const FACULTY_ICONS = {
    'Agriculture': 'fa-tractor', 'Arts': 'fa-palette', 'Law': 'fa-gavel',
    'Science': 'fa-flask', 'Social Sciences': 'fa-users', 'Education': 'fa-chalkboard-teacher',
    'Pharmacy': 'fa-prescription', 'Technology': 'fa-microchip', 'Administration': 'fa-briefcase',
    'Environmental Design and Management': 'fa-building', 'Basic Medical Sciences': 'fa-heartbeat',
    'Clinical Sciences': 'fa-stethoscope', 'Dentistry': 'fa-tooth', 'Computing': 'fa-laptop-code'
};

const COURSES_100 = {
    'Agriculture': { first: ['AGR 101', 'AGR 103', 'GST 111'], second: ['AGR 102', 'AGR 104', 'GST 112'] },
    'Arts': { first: ['ENG 101', 'PHL 101', 'GST 111'], second: ['ENG 102', 'PHL 102', 'GST 112'] },
    'Law': { first: ['JIL 101', 'GST 111'], second: ['JIL 102', 'GST 112'] },
    'Science': { first: ['BIO 101', 'CHM 101', 'MTH 101', 'PHY 101', 'GST 111'], second: ['BIO 102', 'CHM 102', 'MTH 102', 'PHY 102', 'GST 112'] },
    'Social Sciences': { first: ['ECO 101', 'POL 101', 'SOC 101', 'GST 111'], second: ['ECO 102', 'POL 102', 'SOC 102', 'GST 112'] },
    'Education': { first: ['EDU 101', 'EDC 101', 'GST 111'], second: ['EDU 102', 'EDC 102', 'GST 112'] },
    'Pharmacy': { first: ['PCY 101', 'PHY 103', 'MTH 101', 'BIO 101', 'GST 111'], second: ['PCY 102', 'BIO 102', 'MTH 102', 'PHY 104', 'GST 112'] },
    'Technology': { first: ['CHM 101', 'MTH 101', 'PHY 101', 'PHY 103', 'GST 111'], second: ['CHM 102', 'MTH 102', 'PHY 102', 'PHY 104', 'GST 112'] },
    'Administration': { first: ['BUS 101', 'ACC 101', 'GST 111'], second: ['BUS 102', 'ACC 102', 'GST 112'] },
    'Environmental Design and Management': { first: ['ARC 101', 'URP 101', 'GST 111'], second: ['ARC 102', 'URP 102', 'GST 112'] },
    'Basic Medical Sciences': { first: ['ANA 101', 'PHS 101', 'BCH 101', 'GST 111'], second: ['ANA 102', 'PHS 102', 'BCH 102', 'GST 112'] },
    'Clinical Sciences': { first: ['MED 101', 'SUR 101', 'GST 111'], second: ['MED 102', 'SUR 102', 'GST 112'] },
    'Dentistry': { first: ['DEN 101', 'ORA 101', 'GST 111'], second: ['DEN 102', 'ORA 102', 'GST 112'] },
    'Computing': { first: ['COS 101', 'MTH 101', 'PHY 101', 'GST 111'], second: ['COS 102', 'MTH 102', 'PHY 102', 'GST 112'] }
};

const COURSE_NAMES = {
    'GST 111': 'Use of English I', 'GST 112': 'Use of English II',
    'CHM 101': 'General Chemistry I', 'CHM 102': 'General Chemistry II',
    'MTH 101': 'Elementary Math I', 'MTH 102': 'Elementary Math II',
    'PHY 101': 'General Physics I', 'PHY 102': 'General Physics II',
    'BIO 101': 'General Biology I', 'BIO 102': 'General Biology II',
    'COS 101': 'Intro to Computing', 'COS 102': 'Programming Fundamentals',
    'PCY 101': 'Intro to Pharmacy', 'PCY 102': 'Pharmacy Practice'
};
