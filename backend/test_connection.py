import asyncio

from sqlalchemy import text
from app.database import engine


async def main():
    try:
        async with engine.connect() as connection:
            result = await connection.execute(
                text("SELECT 1")
            )

            print("Supabase PostgreSQL connection successful!")
            print("Result:", result.scalar())

    except Exception as error:
        print("Database connection failed!")
        print("Error type:", type(error).__name__)

    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())