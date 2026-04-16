-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- para búsqueda de texto

-- Crear tipos enum
CREATE TYPE user_role AS ENUM ('GUEST', 'HOTEL_ADMIN', 'SUPER_ADMIN');
CREATE TYPE booking_status AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED');
CREATE TYPE hotel_category AS ENUM ('LUXURY', 'BOUTIQUE', 'ECO', 'BEACH', 'MOUNTAIN', 'CITY');
CREATE TYPE extra_category AS ENUM ('SPA', 'DINING', 'TRANSPORT', 'EXPERIENCE', 'OTHER');