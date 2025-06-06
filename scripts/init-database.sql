-- Create database (run this first)
CREATE DATABASE "FSD_Velez";

-- Connect to the database and run the following:

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) UNIQUE NOT NULL,
    nickname VARCHAR(255) NOT NULL,
    profile_url TEXT DEFAULT '',
    deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Channels table
CREATE TABLE IF NOT EXISTS channels (
    id SERIAL PRIMARY KEY,
    channel_url VARCHAR(255) UNIQUE NOT NULL,
    created_by VARCHAR(255) NOT NULL,
    chatmate_id VARCHAR(255),
    deleted BOOLEAN DEFAULT FALSE,
    message_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users (user_id),
    FOREIGN KEY (chatmate_id) REFERENCES users (user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_user_id ON users (user_id);

CREATE INDEX IF NOT EXISTS idx_channels_channel_url ON channels (channel_url);

CREATE INDEX IF NOT EXISTS idx_channels_created_by ON channels (created_by);

CREATE INDEX IF NOT EXISTS idx_channels_chatmate_id ON channels (chatmate_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_channels_updated_at BEFORE UPDATE ON channels
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();