-- Coordinated change — created by Person A once users table exists.
-- Person B should review before running against her resumes table.

-- Adds foreign key constraint to resumes.user_id referencing users.id
ALTER TABLE resumes
    ADD CONSTRAINT fk_resumes_user_id
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE SET NULL;
