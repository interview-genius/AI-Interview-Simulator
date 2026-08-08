import os
import pandas as pd
import psycopg2
from dotenv import load_dotenv

# Load variables from .env
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL was not found in .env")

# CSV location
CSV_PATH = "data/Merged_raw_utf8.csv"

# Required CSV columns
REQUIRED_COLUMNS = [
    "source",
    "source_url",
    "raw_text",
    "company_guess",
    "role_guess",
    "submitted_at",
]


def main():
    print("Loading CSV...")

    df = pd.read_csv(CSV_PATH)

    print(f"CSV rows: {len(df)}")
    print(f"CSV columns: {list(df.columns)}")

    # Check columns
    missing_columns = [
        column for column in REQUIRED_COLUMNS
        if column not in df.columns
    ]

    if missing_columns:
        raise ValueError(
            f"Missing required columns: {missing_columns}"
        )

    print("Column validation successful.")

    # Convert empty strings to None
    df = df.where(pd.notnull(df), None)

    print("Connecting to PostgreSQL...")

    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()

    print("Database connection successful.")

    insert_query = """
        INSERT INTO raw_reports (
            source,
            source_url,
            raw_text,
            company_guess,
            role_guess,
            submitted_at
        )
        VALUES (%s, %s, %s, %s, %s, %s)
        ON CONFLICT (source_url) DO NOTHING;
    """

    inserted = 0
    skipped = 0

    for _, row in df.iterrows():

        cursor.execute(
            insert_query,
            (
                row["source"],
                row["source_url"],
                row["raw_text"],
                row["company_guess"],
                row["role_guess"],
                row["submitted_at"],
            ),
        )

        if cursor.rowcount == 1:
            inserted += 1
        else:
            skipped += 1

    conn.commit()

    cursor.close()
    conn.close()

    print()
    print("Upload complete.")
    print(f"Rows inserted: {inserted}")
    print(f"Rows skipped: {skipped}")


if __name__ == "__main__":
    main()