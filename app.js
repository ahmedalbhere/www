// استيراد وحدات Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.0/firebase-app.js";
import { getDatabase, ref, set, push, onValue, remove, update, get } from "https://www.gstatic.com/firebasejs/9.6.0/firebase-database.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.0/firebase-auth.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.6.0/firebase-storage.js";

// تكوين Firebase - استبدل هذه القيم بتكوين مشروعك
const firebaseConfig = {
  apiKey: "AIzaSyCJ4VhGD49H3RNifMf9VCRPnkALAxNpsOU",
  authDomain: "project-2980864980936907935.firebaseapp.com",
  databaseURL: "https://project-2980864980936907935-default-rtdb.firebaseio.com",
  projectId: "project-2980864980936907935",
  storageBucket: "project-2980864980936907935.appspot.com",
  messagingSenderId: "580110751353",
  appId: "1:580110751353:web:8f039f9b34e1709d4126a8",
  measurementId: "G-R3JNPHCFZG"
};

// تهيئة Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);
const storage = getStorage(app);

// متغيرات التطبيق
let currentUser = null;
let currentUserType = null;

// عناصر DOM
const elements = {
    // الشاشات
    roleSelection: document.getElementById('roleSelection'),
    clientLogin: document.getElementById('clientLogin'),
    barberLogin: document.getElementById('barberLogin'),
    clientDashboard: document.getElementById('clientDashboard'),
    barberDashboard: document.getElementById('barberDashboard'),
    
    // الأزرار الرئيسية
    clientBtn: document.getElementById('clientBtn'),
    barberBtn: document.getElementById('barberBtn'),
    
    // عناصر تسجيل الدخول
    clientLoginBtn: document.getElementById('clientLoginBtn'),
    barberLoginBtn: document.getElementById('barberLoginBtn'),
    barberSignupBtn: document.getElementById('barberSignupBtn'),
    
    // أزرار التنقل
    clientBackBtn: document.getElementById('clientBackBtn'),
    barberBackBtn: document.getElementById('barberBackBtn'),
    showSignupBtn: document.getElementById('showSignupBtn'),
    showLoginBtn: document.getElementById('showLoginBtn'),
    
    // أزرار الخروج
    clientLogoutBtn: document.getElementById('clientLogoutBtn'),
    barberLogoutBtn: document.getElementById('barberLogoutBtn'),
    
    // حقول الإدخال
    clientName: document.getElementById('clientName'),
    clientPhone: document.getElementById('clientPhone'),
    barberPhone: document.getElementById('barberPhone'),
    barberPassword: document.getElementById('barberPassword'),
    barberName: document.getElementById('barberName'),
    newBarberPhone: document.getElementById('newBarberPhone'),
    newBarberPassword: document.getElementById('newBarberPassword'),
    confirmBarberPassword: document.getElementById('confirmBarberPassword'),
    barberImage: document.getElementById('barberImage'),
    salonLink: document.getElementById('salonLink'),
    
    // عناصر أخرى
    barberFormTitle: document.getElementById('barberFormTitle'),
    barberLoginForm: document.getElementById('barberLoginForm'),
    barberSignupForm: document.getElementById('barberSignupForm'),
    clientError: document.getElementById('clientError'),
    barberError: document.getElementById('barberError'),
    clientAvatar: document.getElementById('clientAvatar'),
    barberAvatar: document.getElementById('barberAvatar'),
    statusToggle: document.getElementById('statusToggle'),
    statusText: document.getElementById('statusText'),
    barberQueue: document.getElementById('barberQueue'),
    barbersList: document.getElementById('barbersList'),
    currentBookingContainer: document.getElementById('currentBookingContainer'),
    bookingBarber: document.getElementById('bookingBarber'),
    bookingPosition: document.getElementById('bookingPosition'),
    bookingTime: document.getElementById('bookingTime'),
    cancelBookingBtn: document.getElementById('cancelBookingBtn')
};

// ============= إعداد Event Listeners =============
function setupEventListeners() {
    // أزرار الصفحة الرئيسية
    elements.clientBtn.addEventListener('click', () => showScreen('clientLogin'));
    elements.barberBtn.addEventListener('click', () => showScreen('barberLogin'));
    
    // أزرار تسجيل الدخول
    elements.clientLoginBtn.addEventListener('click', clientLogin);
    elements.barberLoginBtn.addEventListener('click', barberLogin);
    elements.barberSignupBtn.addEventListener('click', barberSignup);
    
    // أزرار التنقل
    elements.clientBackBtn.addEventListener('click', () => showScreen('roleSelection'));
    elements.barberBackBtn.addEventListener('click', () => showScreen('roleSelection'));
    elements.showSignupBtn.addEventListener('click', showBarberSignup);
    elements.showLoginBtn.addEventListener('click', showBarberLogin);
    
    // أزرار الخروج
    elements.clientLogoutBtn.addEventListener('click', logout);
    elements.barberLogoutBtn.addEventListener('click', logout);
    
    // زر إلغاء الحجز
    elements.cancelBookingBtn.addEventListener('click', () => {
        if (currentUser?.booking) {
            cancelBooking(currentUser.booking.barberId, currentUser.booking.bookingId);
        }
    });
}

// ============= وظائف العرض والإخفاء =============
function showScreen(screenId) {
    document.querySelectorAll('.container, .dashboard').forEach(el => {
        el.classList.add('hidden');
    });
    document.getElementById(screenId).classList.remove('hidden');
}

function showBarberSignup() {
    elements.barberFormTitle.textContent = 'إنشاء حساب حلاق جديد';
    elements.barberLoginForm.classList.add('hidden');
    elements.barberSignupForm.classList.remove('hidden');
    clearErrors();
}

function showBarberLogin() {
    elements.barberFormTitle.textContent = 'تسجيل الدخول للحلاقين';
    elements.barberSignupForm.classList.add('hidden');
    elements.barberLoginForm.classList.remove('hidden');
    clearErrors();
}

function clearErrors() {
    elements.clientError.classList.add('hidden');
    elements.barberError.classList.add('hidden');
}

// ============= وظائف إدارة الحسابات =============
async function clientLogin() {
    const name = elements.clientName.value.trim();
    const phone = elements.clientPhone.value.trim();
    
    if (!name) {
        showError(elements.clientError, 'الرجاء إدخال الاسم');
        return;
    }
    
    if (!phone || !/^[0-9]{10,15}$/.test(phone)) {
        showError(elements.clientError, 'الرجاء إدخال رقم هاتف صحيح (10-15 رقمًا)');
        return;
    }
    
    try {
        currentUser = {
            id: generateId(),
            name: name,
            phone: phone,
            type: 'client'
        };
        currentUserType = 'client';
        
        elements.clientAvatar.textContent = name.charAt(0);
        showScreen('clientDashboard');
        await loadBarbers();
    } catch (error) {
        showError(elements.clientError, 'حدث خطأ أثناء تسجيل الدخول');
        console.error(error);
    }
}

async function barberLogin() {
    const phone = elements.barberPhone.value.trim();
    const password = elements.barberPassword.value;
    
    if (!phone || !password) {
        showError(elements.barberError, 'رقم الهاتف وكلمة المرور مطلوبان');
        return;
    }
    
    try {
        const userCredential = await signInWithEmailAndPassword(auth, `${phone}@barber.com`, password);
        const user = userCredential.user;
        
        const barberRef = ref(database, 'barbers/' + user.uid);
        const snapshot = await get(barberRef);
        
        if (snapshot.exists()) {
            const barberData = snapshot.val();
            
            currentUser = {
                id: user.uid,
                name: barberData.name,
                phone: barberData.phone,
                type: 'barber',
                imageUrl: barberData.imageUrl || '',
                salonLink: barberData.salonLink || ''
            };
            
            elements.barberAvatar.textContent = barberData.name.charAt(0);
            showScreen('barberDashboard');
            loadBarberQueue();
        } else {
            showError(elements.barberError, 'بيانات الحلاق غير موجودة');
            await signOut(auth);
        }
    } catch (error) {
        handleAuthError(error, elements.barberError);
    }
}

async function barberSignup() {
    const name = elements.barberName.value.trim();
    const phone = elements.newBarberPhone.value.trim();
    const password = elements.newBarberPassword.value;
    const confirmPassword = elements.confirmBarberPassword.value;
    const salonLink = elements.salonLink.value.trim();
    const imageFile = elements.barberImage.files[0];
    
    // التحقق من صحة البيانات
    if (!name || !phone || !password || !confirmPassword) {
        showError(elements.barberError, 'جميع الحقول مطلوبة');
        return;
    }
    
    if (!/^[0-9]{10,15}$/.test(phone)) {
        showError(elements.barberError, 'رقم الهاتف يجب أن يكون بين 10-15 رقمًا');
        return;
    }
    
    if (password.length < 6) {
        showError(elements.barberError, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل');
        return;
    }
    
    if (password !== confirmPassword) {
        showError(elements.barberError, 'كلمتا المرور غير متطابقتين');
        return;
    }
    
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, `${phone}@barber.com`, password);
        const user = userCredential.user;
        
        let imageUrl = '';
        if (imageFile) {
            const fileRef = storageRef(storage, `barber_images/${user.uid}`);
            await uploadBytes(fileRef, imageFile);
            imageUrl = await getDownloadURL(fileRef);
        }
        
        const barberData = {
            name: name,
            phone: phone,
            status: 'open',
            queue: {},
            salonLink: salonLink || '',
            imageUrl: imageUrl || '',
            createdAt: new Date().toISOString()
        };
        
        await set(ref(database, 'barbers/' + user.uid), barberData);
        
        currentUser = {
            id: user.uid,
            name: name,
            phone: phone,
            type: 'barber',
            imageUrl: imageUrl,
            salonLink: salonLink
        };
        
        elements.barberAvatar.textContent = name.charAt(0);
        showScreen('barberDashboard');
        loadBarberQueue();
    } catch (error) {
        handleAuthError(error, elements.barberError);
    }
}

// ============= وظائف مساعدة =============
function showError(element, message) {
    element.textContent = message;
    element.classList.remove('hidden');
}

function handleAuthError(error, errorElement) {
    let errorMessage = 'حدث خطأ أثناء المصادقة';
    switch(error.code) {
        case 'auth/email-already-in-use':
            errorMessage = 'هذا الرقم مسجل بالفعل';
            break;
        case 'auth/invalid-email':
            errorMessage = 'بريد إلكتروني غير صالح';
            break;
        case 'auth/weak-password':
            errorMessage = 'كلمة المرور ضعيفة جداً';
            break;
        case 'auth/user-not-found':
            errorMessage = 'الحساب غير موجود';
            break;
        case 'auth/wrong-password':
            errorMessage = 'كلمة المرور غير صحيحة';
            break;
        default:
            errorMessage = 'حدث خطأ غير متوقع';
            console.error(error);
    }
    showError(errorElement, errorMessage);
}

function generateId() {
    return 'id-' + Math.random().toString(36).substr(2, 9);
}

// ============= إدارة الحجوزات =============
async function loadBarbers() {
    elements.barbersList.innerHTML = 'جارٍ تحميل الحلاقين...';
    
    onValue(ref(database, 'barbers'), (snapshot) => {
        const barbers = snapshot.val() || {};
        elements.barbersList.innerHTML = '';
        
        if (Object.keys(barbers).length === 0) {
            elements.barbersList.innerHTML = '<div class="no-barbers">لا يوجد حلاقون مسجلون حالياً</div>';
            return;
        }
        
        Object.entries(barbers).forEach(([id, barber]) => {
            const statusClass = barber.status === 'open' ? 'status-open' : 'status-closed';
            const statusText = barber.status === 'open' ? 'مفتوح' : 'مغلق';
            const queueLength = barber.queue ? Object.keys(barber.queue).length : 0;
            
            const barberCard = document.createElement('div');
            barberCard.className = 'barber-card';
            barberCard.innerHTML = `
                <div class="barber-info">
                    <div class="barber-header">
                        ${barber.imageUrl ? 
                            `<img src="${barber.imageUrl}" class="barber-avatar-img" alt="${barber.name}">` : 
                            `<div class="barber-avatar">${barber.name.charAt(0)}</div>`}
                        <div class="barber-name">${barber.name}</div>
                    </div>
                    ${barber.salonLink ? `<a href="${barber.salonLink}" target="_blank" class="salon-link">زيارة الصالون</a>` : ''}
                    <div class="barber-status ${statusClass}">${statusText}</div>
                    <div class="barber-details">
                        <div>رقم الهاتف: ${barber.phone || 'غير متوفر'}</div>
                        <div>عدد المنتظرين: ${queueLength}</div>
                        <div>وقت الانتظار التقريبي: ${queueLength * 15} دقيقة</div>
                    </div>
                </div>
                <button class="book-btn" ${barber.status === 'closed' ? 'disabled' : ''} 
                        data-barber-id="${id}" data-barber-name="${barber.name.replace(/'/g, "\\'")}">
                    ${barber.status === 'open' ? 'احجز الآن' : 'غير متاح'}
                </button>
            `;
            
            // إضافة حدث الحجز
            const bookBtn = barberCard.querySelector('.book-btn');
            bookBtn.addEventListener('click', (e) => {
                const barberId = e.currentTarget.getAttribute('data-barber-id');
                const barberName = e.currentTarget.getAttribute('data-barber-name');
                bookAppointment(barberId, barberName);
            });
            
            elements.barbersList.appendChild(barberCard);
        });
    }, (error) => {
        console.error('Error loading barbers:', error);
        elements.barbersList.innerHTML = '<div class="error-loading">حدث خطأ أثناء تحميل الحلاقين</div>';
    });
}

async function bookAppointment(barberId, barberName) {
    if (!currentUser) return;
    
    try {
        const newBookingRef = push(ref(database, `barbers/${barberId}/queue`));
        const bookingData = {
           
