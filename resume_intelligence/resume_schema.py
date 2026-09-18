"""
Pydantic schema for Person B's Step 7 resume extraction.

Fields per the spec: Education, Experience, Projects, Skills, Leadership,
Achievements. Same "null/empty over guessing" discipline as extraction/'s
Step 3 schemas -- a resume is a much higher-stakes thing to hallucinate on
than an interview report, since it's tied to a real user's real history.
"""

from typing import Optional
from pydantic import BaseModel, Field


class EducationEntry(BaseModel):
    institution: str
    degree: Optional[str] = Field(default=None, description="e.g. 'B.Tech', 'M.S.'")
    field_of_study: Optional[str] = None
    start_date: Optional[str] = Field(default=None, description="As written on the resume, not normalized.")
    end_date: Optional[str] = Field(default=None, description="As written on the resume, not normalized.")
    gpa: Optional[str] = None


class ExperienceEntry(BaseModel):
    company: str
    title: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    bullets: list[str] = Field(
        default_factory=list,
        description="Individual bullet points describing this role, kept separate "
                    "rather than merged into one paragraph."
    )


class ProjectEntry(BaseModel):
    name: str
    bullets: list[str] = Field(default_factory=list)
    technologies: list[str] = Field(default_factory=list)


class LeadershipEntry(BaseModel):
    organization: str
    role: Optional[str] = None
    bullets: list[str] = Field(default_factory=list)


class ResumeExtraction(BaseModel):
    education: list[EducationEntry] = Field(default_factory=list)
    experience: list[ExperienceEntry] = Field(default_factory=list)
    projects: list[ProjectEntry] = Field(default_factory=list)
    skills: list[str] = Field(
        default_factory=list,
        description="Flat list of individual skills, not grouped by category."
    )
    leadership: list[LeadershipEntry] = Field(default_factory=list)
    achievements: list[str] = Field(
        default_factory=list,
        description="Awards, certifications, competition results, publications -- "
                    "anything that doesn't fit Experience/Projects/Leadership."
    )
