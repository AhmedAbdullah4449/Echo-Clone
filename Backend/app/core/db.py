import asyncpg
import os
from dotenv import load_dotenv
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
pool = None

async def connect_db():
    global pool
    pool = await asyncpg.create_pool(DATABASE_URL)
    print("Connect successfully to Database")
    
async def close_db():
    global pool
    pool.close()
    print("Connect closed")
    
async def init_db():
    global pool
    print("Initializing database tables...")
    async with pool.acquire() as connection:        

        # await connection.execute("DROP TABLE IF EXISTS stories CASCADE")
        # await connection.execute("DROP TABLE IF EXISTS generated_audio CASCADE")
        await connection.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """)
        
        await connection.execute("""
                        CREATE TABLE IF NOT EXISTS voice_profiles (
                        id SERIAL PRIMARY KEY,
                        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                        profile_name VARCHAR(100) NOT NULL,            -- e.g., "Mommy's Voice"
                        reference_audio_path TEXT NOT NULL,           -- MinIO path to the 10-sec reference clip
                        is_active BOOLEAN DEFAULT TRUE,               -- To easily toggle between different voices
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );
                """)
        await connection.execute("""
                        CREATE TABLE IF NOT EXISTS stories (
                        id SERIAL PRIMARY KEY,
                        title VARCHAR(255) NOT NULL,
                        content TEXT NOT NULL,                        -- The text for the AI to read
                        category VARCHAR(100),                        -- e.g., 'Bedtime', 'Urdu Poem'
                        estimated_duration INTEGER,                   -- Optional: Estimated seconds to read
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );
                """
                # """
                # INSERT INTO stories (title, content, category) VALUES
                # (
                #     'The Tortoise and the Hare',
                #     'Once upon a time, there was a speedy hare who bragged about how fast he could run. Tired of hearing him boast, Slow and Steady, the tortoise, challenged him to a race.',
                #     'Fable'
                # ),
                # (
                #     'The Lion and the Mouse',
                #     'A lion was sleeping in the forest when a mouse started running up and down on him. This soon woke the lion up, and he was about to eat the mouse when the mouse begged for his life and promised to help the lion in the future. The lion laughed at the idea of a tiny mouse helping him but let him go. A few days later, the lion got caught in a hunter’s net. The mouse heard his roars and came to help him by gnawing through the ropes, setting the lion free.',
                #     'Fiction'
                # ),
                # (
                #     'The Boy Who Cried Wolf',
                #     'There once was a shepherd boy who was bored as he sat on the hillside watching the village sheep. To entertain himself, he took a great breath and sang out, "Wolf! Wolf! The wolf is chasing the sheep!" The villagers came running up the hill to help the boy drive the wolf away. But when they arrived, they found no wolf.',
                #     'Fable'
                # );"""
                )
                
        await connection.execute("""
                                 
                        alter table generated_audio add column if not exists storyName VARCHAR(255);
                        
                        CREATE TABLE IF NOT EXISTS generated_audio (
                        id SERIAL PRIMARY KEY,
                        user_id INTEGER REFERENCES users(id) ON DELETE NO ACTION,
                        voice_profile_id INTEGER REFERENCES voice_profiles(id) ON DELETE NO ACTION,
                        story_id INTEGER REFERENCES stories(id) ON DELETE NO ACTION,
                        task_id VARCHAR(255),                         -- The Celery Task ID from Redis
                        status VARCHAR(50) DEFAULT 'processing',      -- 'processing', 'completed', 'failed'
                        final_audio_path TEXT,                        -- NULL until the worker finishes and saves to MinIO
                        error_message TEXT,                           -- Helpful for debugging if Colab/Ngrok fails
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    );
                """)
        print("Database tables initialized successfully")
  
async def get_db():
    async with pool.acquire() as connection:
        yield connection