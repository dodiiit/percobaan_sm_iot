-- Create database if not exists
CREATE DATABASE IF NOT EXISTS `indowater`;

-- Use the database
USE `indowater`;

-- Include migrations
SOURCE /docker-entrypoint-initdb.d/migrations/001_create_initial_tables.sql;

-- Include seeders
SOURCE /docker-entrypoint-initdb.d/seeders/001_initial_data.sql;