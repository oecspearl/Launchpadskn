-- LaunchPad SKN Database Setup Script
-- Run this script in PostgreSQL to create the required databases

-- Connect to PostgreSQL as superuser (typically 'postgres')
-- psql -U postgres

-- Create databases
CREATE DATABASE scholarspace_users;
CREATE DATABASE scholarspace_institutions;
CREATE DATABASE scholarspace_courses;

-- Verify databases were created
\list

-- Note: The application will automatically create tables using JPA/Hibernate
-- with ddl-auto: update configuration

