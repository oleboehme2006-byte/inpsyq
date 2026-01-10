# Data Processing Agreement (DPA / AVV)

**Between:**
- **Data Controller:** [Customer Name] ("Customer")
- **Data Processor:** InPsyq GmbH ("Processor")

**Effective Date:** [Date]

---

## 1. Subject Matter and Duration

### 1.1 Subject Matter
This DPA governs the processing of personal data by the Processor on behalf of the Customer
in connection with the InPsyq team wellbeing analytics service.

### 1.2 Duration
This DPA remains in effect for the duration of the main service agreement.

---

## 2. Nature and Purpose of Processing

The Processor processes personal data to:
- Collect employee wellbeing responses
- Generate aggregated team insights
- Provide analytics dashboards to authorized users

---

## 3. Types of Personal Data

| Category | Examples |
|----------|----------|
| Account Data | Name, email, organization membership |
| Session Data | Responses to wellbeing questions, timestamps |
| Derived Data | Team-level aggregated indices |
| Technical Data | Session IDs, access logs |

---

## 4. Categories of Data Subjects

- Employees of the Customer's organization

---

## 5. Processor Obligations

The Processor shall:
- Process data only on documented instructions from the Controller
- Ensure personnel are bound by confidentiality
- Implement appropriate technical and organizational measures (TOMs)
- Assist the Controller with data subject rights requests
- Delete or return data upon termination
- Make available information necessary to demonstrate compliance
- Allow and contribute to audits

---

## 6. Technical and Organizational Measures (TOMs)

### 6.1 Encryption
- Data encrypted in transit (TLS 1.3)
- Data encrypted at rest (AES-256)

### 6.2 Access Control
- Role-based access control (RBAC)
- Multi-factor authentication for admin access
- Audit logging of access events

### 6.3 Data Minimization
- Only necessary data collected
- Aggregation at team level (minimum 5 members)
- Retention limits enforced

### 6.4 Availability
- Daily database backups
- Multi-region hosting capability
- Incident response procedures

---

## 7. Subprocessors

The Controller authorizes the use of the following subprocessors:

| Subprocessor | Purpose | Location |
|--------------|---------|----------|
| Vercel Inc. | Hosting, CDN | USA (EU data region) |
| Neon Inc. | Database hosting | EU (Frankfurt) |
| OpenAI Inc. | LLM interpretation (optional) | USA |

The Processor shall notify the Controller of changes to subprocessors with 30 days notice.

---

## 8. Data Subject Rights

The Processor shall assist the Controller in responding to data subject requests for:
- Access to personal data
- Rectification
- Erasure
- Restriction of processing
- Data portability
- Objection to processing

Response timeline: Within 15 business days of receiving Controller's request.

---

## 9. Data Breach Notification

The Processor shall notify the Controller without undue delay (within 48 hours)
after becoming aware of a personal data breach.

---

## 10. Data Retention and Deletion

| Data Type | Retention |
|-----------|-----------|
| Session responses | 12 months |
| Aggregated metrics | Indefinite (anonymized) |
| Audit logs | 24 months |

Upon termination, data shall be deleted within 30 days unless legal retention applies.

---

## 11. Governing Law

This DPA is governed by the laws of Germany. GDPR Article 28 requirements apply.

---

## Signatures

**Customer (Data Controller):**

Name: _______________________  
Title: _______________________  
Date: _______________________  

**InPsyq GmbH (Data Processor):**

Name: _______________________  
Title: _______________________  
Date: _______________________

---

*This document is a template. Execute with appropriate signatures for binding effect.*
