// ===================================================================
// SQL EXAMPLES — Sample schemas for the ER Diagram Generator
// ===================================================================

const SQL_EXAMPLES = {
  ecommerce: `-- =============================================
-- E-Commerce Database Schema
-- =============================================

CREATE TABLE customers (
    customer_id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    CONSTRAINT chk_email CHECK (email LIKE '%@%.%')
);

CREATE TABLE categories (
    category_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    parent_category_id INT REFERENCES categories(category_id),
    image_url VARCHAR(500),
    sort_order INT DEFAULT 0
);

CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,
    sku VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    cost DECIMAL(10,2),
    stock_quantity INT DEFAULT 0,
    category_id INT NOT NULL REFERENCES categories(category_id),
    weight DECIMAL(8,2),
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_price CHECK (price > 0),
    CONSTRAINT chk_stock CHECK (stock_quantity >= 0)
);

CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL REFERENCES customers(customer_id),
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(30) DEFAULT 'pending',
    shipping_address TEXT NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    tracking_number VARCHAR(100),
    notes TEXT,
    CONSTRAINT chk_status CHECK (status IN ('pending','processing','shipped','delivered','cancelled'))
);

CREATE TABLE order_items (
    item_id SERIAL PRIMARY KEY,
    order_id INT NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES products(product_id),
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    discount DECIMAL(5,2) DEFAULT 0,
    CONSTRAINT chk_qty CHECK (quantity > 0)
);

CREATE TABLE payments (
    payment_id SERIAL PRIMARY KEY,
    order_id INT NOT NULL REFERENCES orders(order_id),
    amount DECIMAL(12,2) NOT NULL,
    payment_method VARCHAR(30) NOT NULL,
    transaction_id VARCHAR(100),
    status VARCHAR(20) DEFAULT 'pending',
    paid_at TIMESTAMP,
    CONSTRAINT chk_payment_method CHECK (payment_method IN ('credit_card','debit_card','paypal','bank_transfer'))
);

CREATE TABLE reviews (
    review_id SERIAL PRIMARY KEY,
    product_id INT NOT NULL REFERENCES products(product_id),
    customer_id INT NOT NULL REFERENCES customers(customer_id),
    rating INT NOT NULL,
    title VARCHAR(200),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_rating CHECK (rating BETWEEN 1 AND 5),
    CONSTRAINT uq_review UNIQUE (product_id, customer_id)
);

CREATE TABLE wishlists (
    wishlist_id SERIAL PRIMARY KEY,
    customer_id INT NOT NULL REFERENCES customers(customer_id),
    product_id INT NOT NULL REFERENCES products(product_id),
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_wishlist UNIQUE (customer_id, product_id)
);`,

  university: `-- =============================================
-- University Database Schema
-- =============================================

CREATE TABLE departments (
    dept_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    building VARCHAR(50),
    budget DECIMAL(12,2) DEFAULT 0,
    head_professor_id INT
);

CREATE TABLE professors (
    professor_id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    dept_id INT REFERENCES departments(dept_id),
    hire_date DATE NOT NULL,
    salary DECIMAL(10,2),
    title VARCHAR(50) DEFAULT 'Assistant Professor',
    office VARCHAR(20)
);

ALTER TABLE departments ADD CONSTRAINT fk_head
    FOREIGN KEY (head_professor_id) REFERENCES professors(professor_id);

CREATE TABLE students (
    student_id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    date_of_birth DATE,
    enrollment_date DATE DEFAULT CURRENT_DATE,
    gpa DECIMAL(3,2) DEFAULT 0.00,
    dept_id INT REFERENCES departments(dept_id),
    CONSTRAINT chk_gpa CHECK (gpa BETWEEN 0.00 AND 4.00)
);

CREATE TABLE courses (
    course_id SERIAL PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    credits INT NOT NULL,
    dept_id INT NOT NULL REFERENCES departments(dept_id),
    professor_id INT REFERENCES professors(professor_id),
    max_students INT DEFAULT 30,
    CONSTRAINT chk_credits CHECK (credits BETWEEN 1 AND 8)
);

CREATE TABLE enrollments (
    enrollment_id SERIAL PRIMARY KEY,
    student_id INT NOT NULL REFERENCES students(student_id),
    course_id INT NOT NULL REFERENCES courses(course_id),
    semester VARCHAR(20) NOT NULL,
    grade VARCHAR(2),
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_enrollment UNIQUE (student_id, course_id, semester)
);

CREATE TABLE prerequisites (
    prereq_id SERIAL PRIMARY KEY,
    course_id INT NOT NULL REFERENCES courses(course_id),
    required_course_id INT NOT NULL REFERENCES courses(course_id),
    CONSTRAINT chk_not_self CHECK (course_id != required_course_id),
    CONSTRAINT uq_prereq UNIQUE (course_id, required_course_id)
);`,

  social: `-- =============================================
-- Social Network Database Schema
-- =============================================

CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(30) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    bio TEXT,
    avatar_url VARCHAR(500),
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

CREATE TABLE posts (
    post_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    media_url VARCHAR(500),
    visibility VARCHAR(20) DEFAULT 'public',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    like_count INT DEFAULT 0,
    CONSTRAINT chk_visibility CHECK (visibility IN ('public','private','friends'))
);

CREATE TABLE comments (
    comment_id SERIAL PRIMARY KEY,
    post_id INT NOT NULL REFERENCES posts(post_id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(user_id),
    parent_comment_id INT REFERENCES comments(comment_id),
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE likes (
    like_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id),
    post_id INT NOT NULL REFERENCES posts(post_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_like UNIQUE (user_id, post_id)
);

CREATE TABLE friendships (
    friendship_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id),
    friend_id INT NOT NULL REFERENCES users(user_id),
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_not_self CHECK (user_id != friend_id),
    CONSTRAINT uq_friendship UNIQUE (user_id, friend_id),
    CONSTRAINT chk_friendship_status CHECK (status IN ('pending','accepted','blocked'))
);

CREATE TABLE messages (
    message_id SERIAL PRIMARY KEY,
    sender_id INT NOT NULL REFERENCES users(user_id),
    receiver_id INT NOT NULL REFERENCES users(user_id),
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_not_self_msg CHECK (sender_id != receiver_id)
);

CREATE TABLE hashtags (
    hashtag_id SERIAL PRIMARY KEY,
    tag VARCHAR(100) UNIQUE NOT NULL,
    post_count INT DEFAULT 0
);

CREATE TABLE post_hashtags (
    post_id INT NOT NULL REFERENCES posts(post_id) ON DELETE CASCADE,
    hashtag_id INT NOT NULL REFERENCES hashtags(hashtag_id),
    PRIMARY KEY (post_id, hashtag_id)
);`,

  hospital: `-- =============================================
-- Hospital Management Database Schema
-- =============================================

CREATE TABLE departments (
    dept_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    floor INT,
    phone VARCHAR(20),
    head_doctor_id INT
);

CREATE TABLE doctors (
    doctor_id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    specialization VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    dept_id INT REFERENCES departments(dept_id),
    license_number VARCHAR(50) UNIQUE NOT NULL,
    hire_date DATE NOT NULL,
    salary DECIMAL(10,2)
);

ALTER TABLE departments ADD CONSTRAINT fk_head_doctor
    FOREIGN KEY (head_doctor_id) REFERENCES doctors(doctor_id);

CREATE TABLE patients (
    patient_id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(10),
    blood_type VARCHAR(5),
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    emergency_contact VARCHAR(100),
    insurance_id VARCHAR(50),
    CONSTRAINT chk_gender CHECK (gender IN ('Male','Female','Other')),
    CONSTRAINT chk_blood CHECK (blood_type IN ('A+','A-','B+','B-','AB+','AB-','O+','O-'))
);

CREATE TABLE rooms (
    room_id SERIAL PRIMARY KEY,
    room_number VARCHAR(10) UNIQUE NOT NULL,
    dept_id INT REFERENCES departments(dept_id),
    room_type VARCHAR(30) NOT NULL,
    capacity INT DEFAULT 1,
    daily_rate DECIMAL(8,2) NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    CONSTRAINT chk_room_type CHECK (room_type IN ('General','Private','ICU','Operating','Emergency'))
);

CREATE TABLE appointments (
    appointment_id SERIAL PRIMARY KEY,
    patient_id INT NOT NULL REFERENCES patients(patient_id),
    doctor_id INT NOT NULL REFERENCES doctors(doctor_id),
    appointment_date TIMESTAMP NOT NULL,
    duration_minutes INT DEFAULT 30,
    status VARCHAR(20) DEFAULT 'scheduled',
    reason TEXT,
    notes TEXT,
    CONSTRAINT chk_apt_status CHECK (status IN ('scheduled','completed','cancelled','no_show'))
);

CREATE TABLE admissions (
    admission_id SERIAL PRIMARY KEY,
    patient_id INT NOT NULL REFERENCES patients(patient_id),
    room_id INT NOT NULL REFERENCES rooms(room_id),
    doctor_id INT NOT NULL REFERENCES doctors(doctor_id),
    admission_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    discharge_date TIMESTAMP,
    diagnosis TEXT,
    status VARCHAR(20) DEFAULT 'admitted',
    CONSTRAINT chk_adm_status CHECK (status IN ('admitted','discharged','transferred'))
);

CREATE TABLE prescriptions (
    prescription_id SERIAL PRIMARY KEY,
    patient_id INT NOT NULL REFERENCES patients(patient_id),
    doctor_id INT NOT NULL REFERENCES doctors(doctor_id),
    admission_id INT REFERENCES admissions(admission_id),
    medication VARCHAR(200) NOT NULL,
    dosage VARCHAR(100) NOT NULL,
    frequency VARCHAR(50),
    start_date DATE NOT NULL,
    end_date DATE,
    notes TEXT
);

CREATE TABLE lab_tests (
    test_id SERIAL PRIMARY KEY,
    patient_id INT NOT NULL REFERENCES patients(patient_id),
    doctor_id INT NOT NULL REFERENCES doctors(doctor_id),
    test_name VARCHAR(200) NOT NULL,
    test_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    results TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    CONSTRAINT chk_test_status CHECK (status IN ('pending','in_progress','completed'))
);

CREATE TABLE billing (
    bill_id SERIAL PRIMARY KEY,
    patient_id INT NOT NULL REFERENCES patients(patient_id),
    admission_id INT REFERENCES admissions(admission_id),
    total_amount DECIMAL(12,2) NOT NULL,
    paid_amount DECIMAL(12,2) DEFAULT 0,
    payment_status VARCHAR(20) DEFAULT 'unpaid',
    bill_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date DATE,
    CONSTRAINT chk_bill_status CHECK (payment_status IN ('unpaid','partial','paid','overdue'))
);`,

  complex: `-- =============================================
-- Complex SQL Features Demo
-- Arrays, JSON, CHECK, Constraints, etc.
-- =============================================

CREATE TABLE user_profiles (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    preferences JSONB DEFAULT '{}',
    tags TEXT[],
    metadata JSON,
    scores INT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT chk_username_len CHECK (LENGTH(username) >= 3),
    CONSTRAINT chk_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\\\.[A-Za-z]{2,}$')
);

CREATE TABLE projects (
    project_id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    owner_id INT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'draft',
    priority INT DEFAULT 3,
    budget DECIMAL(15,2),
    settings JSONB DEFAULT '{"notifications": true}',
    team_members INT[],
    milestones JSONB,
    start_date DATE,
    end_date DATE,
    CONSTRAINT chk_status CHECK (status IN ('draft','active','paused','completed','archived')),
    CONSTRAINT chk_priority CHECK (priority BETWEEN 1 AND 5),
    CONSTRAINT chk_dates CHECK (end_date IS NULL OR end_date >= start_date),
    CONSTRAINT chk_budget CHECK (budget IS NULL OR budget >= 0)
);

CREATE TABLE tasks (
    task_id SERIAL PRIMARY KEY,
    project_id INT NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    title VARCHAR(300) NOT NULL,
    description TEXT,
    assigned_to INT REFERENCES user_profiles(id) ON DELETE SET NULL,
    created_by INT NOT NULL REFERENCES user_profiles(id),
    status VARCHAR(20) DEFAULT 'todo',
    priority INT DEFAULT 3,
    labels TEXT[] DEFAULT '{}',
    estimated_hours DECIMAL(6,2),
    actual_hours DECIMAL(6,2),
    due_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    dependencies INT[],
    custom_fields JSONB DEFAULT '{}',
    CONSTRAINT chk_task_status CHECK (status IN ('todo','in_progress','review','done','cancelled')),
    CONSTRAINT chk_task_priority CHECK (priority BETWEEN 1 AND 5),
    CONSTRAINT chk_hours CHECK (estimated_hours IS NULL OR estimated_hours > 0)
);

CREATE TABLE task_comments (
    comment_id SERIAL PRIMARY KEY,
    task_id INT NOT NULL REFERENCES tasks(task_id) ON DELETE CASCADE,
    author_id INT NOT NULL REFERENCES user_profiles(id),
    content TEXT NOT NULL,
    attachments JSONB DEFAULT '[]',
    mentions INT[],
    is_internal BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    edited_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE audit_log (
    log_id BIGSERIAL PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    record_id INT NOT NULL,
    action VARCHAR(10) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    changed_by INT REFERENCES user_profiles(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    CONSTRAINT chk_action CHECK (action IN ('INSERT','UPDATE','DELETE'))
);

CREATE TABLE project_roles (
    project_id INT NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    role VARCHAR(30) NOT NULL DEFAULT 'member',
    permissions JSONB DEFAULT '{"read": true, "write": false}',
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    granted_by INT REFERENCES user_profiles(id),
    PRIMARY KEY (project_id, user_id),
    CONSTRAINT chk_role CHECK (role IN ('admin','manager','member','viewer'))
);`
};
