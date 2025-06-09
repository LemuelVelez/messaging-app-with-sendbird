-- Add additional useful columns to the users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Add additional useful columns to the channels table  
ALTER TABLE channels ADD COLUMN IF NOT EXISTS channel_type VARCHAR(50) DEFAULT 'group';
ALTER TABLE channels ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE channels ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMP;

-- Create messages table for additional tracking (optional)
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    message_id VARCHAR(255) UNIQUE NOT NULL,
    channel_url VARCHAR(255) NOT NULL,
    sender_id VARCHAR(255) NOT NULL,
    message_type VARCHAR(50) DEFAULT 'user',
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (channel_url) REFERENCES channels (channel_url),
    FOREIGN KEY (sender_id) REFERENCES users (user_id)
);

-- Create indexes for the messages table
CREATE INDEX IF NOT EXISTS idx_messages_channel_url ON messages (channel_url);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages (sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages (created_at);

-- Update trigger for messages table
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update channel's last_message_at when a message is added
CREATE OR REPLACE FUNCTION update_channel_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE channels 
    SET last_message_at = NEW.created_at,
        updated_at = CURRENT_TIMESTAMP
    WHERE channel_url = NEW.channel_url;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update channel's last message timestamp
CREATE TRIGGER update_channel_last_message_trigger
    AFTER INSERT ON messages
    FOR EACH ROW EXECUTE FUNCTION update_channel_last_message();


-- Additional database improvements
-- Add indexes for better performance if not exists
CREATE INDEX IF NOT EXISTS idx_users_nickname ON users (nickname);
CREATE INDEX IF NOT EXISTS idx_channels_message_count ON channels (message_count);

-- Add a messages tracking table for better analytics
CREATE TABLE IF NOT EXISTS message_events (
    id SERIAL PRIMARY KEY,
    channel_url VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    message_type VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (channel_url) REFERENCES channels (channel_url),
    FOREIGN KEY (user_id) REFERENCES users (user_id)
);

CREATE INDEX IF NOT EXISTS idx_message_events_channel ON message_events (channel_url);
CREATE INDEX IF NOT EXISTS idx_message_events_user ON message_events (user_id);
