-- Table: users (optional for login)
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
);

-- Table: devices
CREATE TABLE IF NOT EXISTS devices (
    device_id INT AUTO_INCREMENT PRIMARY KEY,
    model_name VARCHAR(255) NOT NULL,
    serial_number VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    description TEXT
);

-- Table: templates
CREATE TABLE IF NOT EXISTS templates (
    template_id INT AUTO_INCREMENT PRIMARY KEY,
    template_name VARCHAR(255) NOT NULL,
    created_by VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table: template_devices (link devices to templates)
CREATE TABLE IF NOT EXISTS template_devices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    template_id INT,
    device_id INT,
    FOREIGN KEY (template_id) REFERENCES templates(template_id) ON DELETE CASCADE,
    FOREIGN KEY (device_id) REFERENCES devices(device_id) ON DELETE CASCADE
);

-- Table: checklists
CREATE TABLE IF NOT EXISTS checklists (
    checklist_id INT AUTO_INCREMENT PRIMARY KEY,
    checklist_name VARCHAR(255),
    checked_by VARCHAR(100),
    location VARCHAR(255),
    date_created DATETIME DEFAULT CURRENT_TIMESTAMP,
    template_id INT
);

-- Table: checklist_items
CREATE TABLE IF NOT EXISTS checklist_items (
    item_id INT AUTO_INCREMENT PRIMARY KEY,
    checklist_id INT,
    device_id INT,
    check_status VARCHAR(50),
    issue_description TEXT,
    checked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (checklist_id) REFERENCES checklists(checklist_id) ON DELETE CASCADE,
    FOREIGN KEY (device_id) REFERENCES devices(device_id)
);
