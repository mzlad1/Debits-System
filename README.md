# نظام إدارة الديون

نظام ويب احترافي لإدارة ديون ومدفوعات الزبائن باستخدام React + Vite + Firebase

## المميزات

✅ **إدارة الزبائن**
- إضافة زبائن جدد مع معلومات الاتصال
- البحث السريع عن الزبائن بالاسم
- عرض جميع الزبائن مع أرصدتهم

✅ **إدارة المعاملات**
- تسجيل الديون (مشتريات على الحساب)
- تسجيل المدفوعات الكاش (لا تُحسب في الرصيد)
- تسجيل الدفعات من الزبائن
- عرض سجل كامل للمعاملات مع التواريخ

✅ **حساب الأرصدة التلقائي**
- الرصيد = مجموع الديون - مجموع الدفعات
- المدفوعات الكاش لا تُؤثر على الرصيد
- عرض واضح لكل زبون

✅ **واجهة عربية حديثة**
- تصميم عصري بألوان احترافية
- تدعم RTL بالكامل
- Responsive على جميع الشاشات
- تأثيرات وانيميشنز سلسة

## التثبيت والإعداد

### 1. المتطلبات
- Node.js (النسخة 16 أو أحدث)
- حساب Firebase

### 2. إعداد Firebase

1. اذهب إلى [Firebase Console](https://console.firebase.google.com/)
2. أنشئ مشروع جديد أو استخدم مشروع موجود
3. فعّل **Authentication** واختر Email/Password
4. فعّل **Firestore Database**
5. من إعدادات المشروع، احصل على Firebase Configuration

### 3. ضبط الإعدادات

افتح ملف `.env` وضع فيه بيانات Firebase الخاصة بك:

```env
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### 4. تثبيت المكتبات

```bash
npm install
```

### 5. تشغيل التطبيق

```bash
npm run dev
```

التطبيق سيعمل على: `http://localhost:5173`

## قواعد Firestore

للحصول على أفضل أداء وأمان، استخدم هذه القواعد في Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Customers collection
    match /customers/{customerId} {
      allow read, write: if request.auth != null && 
                           request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && 
                       request.auth.uid == request.resource.data.userId;
    }
    
    // Transactions collection
    match /transactions/{transactionId} {
      allow read, write: if request.auth != null && 
                           request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && 
                       request.auth.uid == request.resource.data.userId;
    }
  }
}
```

## هيكلة البيانات

### مجموعة الزبائن (customers)
```javascript
{
  id: "auto-generated",
  name: "اسم الزبون",
  phone: "رقم الهاتف (اختياري)",
  notes: "ملاحظات (اختياري)",
  createdAt: timestamp,
  userId: "معرف المستخدم"
}
```

### مجموعة المعاملات (transactions)
```javascript
{
  id: "auto-generated",
  type: "debt" | "payment",
  customerId: "معرف الزبون",
  customerName: "اسم الزبون",
  transactionType: "debt" | "cash", // للديون فقط
  description: "وصف المشتريات", // للديون فقط
  amount: number,
  createdAt: timestamp,
  userId: "معرف المستخدم"
}
```

## كيفية الاستخدام

### 1. إنشاء حساب
- سجل دخول أو أنشئ حساب جديد
- استخدم بريد إلكتروني وكلمة مرور قوية

### 2. إضافة زبون
- اضغط على "إضافة زبون"
- أدخل الاسم (إلزامي)
- اختياري: رقم الهاتف والملاحظات

### 3. تسجيل دين
- اضغط على "إضافة معاملة"
- اختر "دين/مشتريات"
- اختر الزبون
- اختر "دين (على الحساب)" أو "كاش"
- اكتب التفصيل (ماذا اشترى)
- أدخل المبلغ

### 4. تسجيل دفعة
- اضغط على "إضافة معاملة"
- اختر "دفعة"
- اختر الزبون
- أدخل المبلغ

### 5. عرض التفاصيل
- ابحث عن الزبون أو اختره من القائمة
- اضغط على الكارد لتوسيعه
- شاهد جميع المعاملات والرصيد

## البناء للإنتاج

```bash
npm run build
```

الملفات الجاهزة ستكون في مجلد `dist`

## التقنيات المستخدمة

- **React 18** - مكتبة واجهة المستخدم
- **Vite** - أداة البناء السريعة
- **Firebase Authentication** - المصادقة والأمان
- **Cloud Firestore** - قاعدة بيانات NoSQL
- **React Router** - التنقل بين الصفحات
- **CSS3** - تصميم عصري مع متغيرات CSS

## الدعم

إذا واجهت أي مشاكل:
1. تأكد من صحة بيانات Firebase في ملف `.env`
2. تأكد من تفعيل Authentication و Firestore
3. راجع قواعد الأمان في Firestore
4. تحقق من console المتصفح للأخطاء

---

صُنع بـ ❤️ للمحلات التجارية
