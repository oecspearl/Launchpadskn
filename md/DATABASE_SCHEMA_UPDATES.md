# Database Schema Updates

## Overview
The following database schema changes will be automatically applied when you start the services due to `spring.jpa.hibernate.ddl-auto: update` configuration.

## User Service Database (scholarspace_users)

### Users Table Updates
```sql
-- New columns added to users table
ALTER TABLE users ADD COLUMN phone VARCHAR(255);
ALTER TABLE users ADD COLUMN date_of_birth DATE;
ALTER TABLE users ADD COLUMN address TEXT;
ALTER TABLE users ADD COLUMN emergency_contact VARCHAR(255);
```

## Institution Service Database (scholarspace_institutions)

### Institutions Table Updates
```sql
-- New columns added to institutions table
ALTER TABLE institutions ADD COLUMN phone VARCHAR(255);
ALTER TABLE institutions ADD COLUMN website VARCHAR(255);
ALTER TABLE institutions ADD COLUMN established_year INTEGER;
ALTER TABLE institutions ADD COLUMN institution_type VARCHAR(255);

-- Update name column to be unique
ALTER TABLE institutions ADD CONSTRAINT uk_institutions_name UNIQUE (name);
```

### Departments Table Updates
```sql
-- New columns added to departments table
ALTER TABLE departments ADD COLUMN head_of_department VARCHAR(255);
ALTER TABLE departments ADD COLUMN department_email VARCHAR(255);
ALTER TABLE departments ADD COLUMN office_location VARCHAR(255);
```

## Course Service Database (scholarspace_courses)

### No schema changes required
The course service database schema remains unchanged as no new fields were added to the Course model.

## Automatic Migration
- **Hibernate DDL Mode**: `update` - automatically applies schema changes
- **Data Safety**: Existing data will be preserved
- **New Columns**: Will be created with NULL values for existing records
- **Constraints**: New unique constraints will be added

## Manual Verification (Optional)
After starting the services, you can verify the schema updates by connecting to your PostgreSQL databases and running:

```sql
-- Check users table structure
\d users;

-- Check institutions table structure  
\d institutions;

-- Check departments table structure
\d departments;
```

## Rollback Plan
If you need to rollback these changes:

```sql
-- Remove new columns from users table
ALTER TABLE users DROP COLUMN phone;
ALTER TABLE users DROP COLUMN date_of_birth;
ALTER TABLE users DROP COLUMN address;
ALTER TABLE users DROP COLUMN emergency_contact;

-- Remove new columns from institutions table
ALTER TABLE institutions DROP COLUMN phone;
ALTER TABLE institutions DROP COLUMN website;
ALTER TABLE institutions DROP COLUMN established_year;
ALTER TABLE institutions DROP COLUMN institution_type;

-- Remove new columns from departments table
ALTER TABLE departments DROP COLUMN head_of_department;
ALTER TABLE departments DROP COLUMN department_email;
ALTER TABLE departments DROP COLUMN office_location;
```

## Notes
- All new fields are optional (nullable) to maintain backward compatibility
- Institution type enum values: UNIVERSITY, COLLEGE, SCHOOL, INSTITUTE
- The unique constraint on institution name prevents duplicate institution names
- Students are identified by their userId (database primary key)